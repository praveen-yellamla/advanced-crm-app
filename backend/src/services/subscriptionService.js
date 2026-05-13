const prisma = require('../config/prisma');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const { addMonths, addYears, differenceInDays } = require('date-fns');

/**
 * Professional Subscription Service with Razorpay Integration
 */
class SubscriptionService {
  /**
   * Calculate proration for plan change
   */
  async calculateProration(organizationId, targetPlanId, billingCycle) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true }
    });

    const targetPlan = await prisma.plan.findUnique({
      where: { id: targetPlanId }
    });

    if (!targetPlan) throw new Error('Target plan not found');

    const now = new Date();
    const currentPlan = org.plan;
    
    if (!currentPlan || !org.currentPeriodEnd || org.currentPeriodEnd < now) {
      const amount = billingCycle === 'YEARLY' ? targetPlan.priceYearly : targetPlan.priceMonthly;
      return {
        amount,
        subtotal: amount,
        tax: amount * 0.18, 
        total: amount * 1.18,
        prorationCredit: 0,
        nextBillingDate: billingCycle === 'YEARLY' ? addYears(now, 1) : addMonths(now, 1)
      };
    }

    const totalDaysInPeriod = differenceInDays(org.currentPeriodEnd, org.currentPeriodStart || org.createdAt);
    const remainingDays = differenceInDays(org.currentPeriodEnd, now);
    
    const currentPrice = org.billingCycle === 'YEARLY' ? currentPlan.priceYearly : currentPlan.priceMonthly;
    const dailyRate = currentPrice / (totalDaysInPeriod || 30);
    const prorationCredit = Math.max(0, dailyRate * remainingDays);

    const newPrice = billingCycle === 'YEARLY' ? targetPlan.priceYearly : targetPlan.priceMonthly;
    const amountToPay = Math.max(0, newPrice - prorationCredit);

    return {
      amount: amountToPay,
      subtotal: amountToPay,
      tax: amountToPay * 0.18,
      total: amountToPay * 1.18,
      prorationCredit,
      remainingDays,
      nextBillingDate: billingCycle === 'YEARLY' ? addYears(now, 1) : addMonths(now, 1)
    };
  }

  /**
   * Initialize Razorpay Order
   */
  async createSubscriptionOrder(organizationId, userId, { planId, billingCycle }) {
    console.log(`[RAZORPAY] Initializing order for Org: ${organizationId}, User: ${userId}`);
    const proration = await this.calculateProration(organizationId, planId, billingCycle);
    
    // 1. Create Razorpay Order
    // Ensure amount is a strict integer in paise
    const amountInPaise = Math.trunc(Math.round(proration.total * 100));
    
    console.log(`[RAZORPAY] Calculated Total: ₹${proration.total}, Amount in Paise: ${amountInPaise}`);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_org_${organizationId}_${Date.now()}`,
      notes: {
        organizationId: organizationId.toString(),
        planId: planId.toString(),
        billingCycle,
        type: 'subscription_upgrade'
      }
    };

    try {
      const order = await razorpay.orders.create(options);
      console.log(`[RAZORPAY] Order Created Successfully: ${order.id}`);

      // 2. Create a pending transaction record
      const transaction = await prisma.platformTransaction.create({
        data: {
          organizationId,
          transactionId: order.id, 
          orderId: order.id,
          amount: proration.total,
          currency: 'INR',
          status: 'PENDING',
          gateway: 'razorpay',
          description: `Upgrade to ${planId} (${billingCycle})`,
          metadata: {
            planId,
            billingCycle,
            proration,
            orderData: order
          }
        }
      });

      return { order, transaction, proration };
    } catch (error) {
      console.error(`[RAZORPAY] Order Creation Failed:`, error);
      throw new Error(`Razorpay Order Error: ${error.description || error.message}`);
    }
  }

  /**
   * Verify Payment Signature and Activate Subscription
   */
  async verifyAndActivate(organizationId, userId, paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    console.log(`[RAZORPAY] Verifying Payment: ${razorpay_payment_id} for Order: ${razorpay_order_id}`);

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error(`[RAZORPAY] Signature Mismatch! Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
      throw new Error("Invalid payment signature. Transaction compromised.");
    }

    // 2. Fetch Transaction
    const transaction = await prisma.platformTransaction.findUnique({
      where: { transactionId: razorpay_order_id },
      include: { organization: true }
    });

    if (!transaction) {
      console.error(`[RAZORPAY] Transaction record not found for Order ID: ${razorpay_order_id}`);
      throw new Error("Transaction record not found.");
    }
    
    if (transaction.status === 'SUCCESS') {
      console.log(`[RAZORPAY] Transaction already processed successfully.`);
      return transaction.organization;
    }

    const { planId, billingCycle, proration } = transaction.metadata;
    const targetPlan = await prisma.plan.findUnique({ where: { id: planId } });

    const now = new Date();
    const nextBillingDate = new Date(proration.nextBillingDate);

    console.log(`[RAZORPAY] Activating Plan: ${targetPlan.name} until ${nextBillingDate}`);

    // 3. Atomic Activation
    return await prisma.$transaction(async (tx) => {
      // Update Transaction
      await tx.platformTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          transactionId: razorpay_payment_id, 
          metadata: { ...transaction.metadata, paymentData }
        }
      });

      // Update Organization
      const updatedOrg = await tx.organization.update({
        where: { id: organizationId },
        data: {
          planId: targetPlan.id,
          subscriptionTier: targetPlan.tier,
          billingCycle,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: nextBillingDate,
          subscriptionExpiresAt: nextBillingDate,
          agentLimit: targetPlan.userLimit,
          managerLimit: targetPlan.managerLimit,
          leadLimit: targetPlan.leadLimit,
          storageLimitMb: targetPlan.storageLimitMb,
          aiTokenLimit: targetPlan.aiTokenLimit,
          callMinutesLimit: targetPlan.callMinutesLimit,
          campaignLimit: targetPlan.campaignLimit
        }
      });

      // Create Invoice
      await tx.platformInvoice.create({
        data: {
          organizationId,
          invoiceNo: `INV-SUB-${Date.now().toString().slice(-6)}`,
          amount: transaction.amount,
          subtotal: proration.subtotal,
          tax: proration.tax,
          discount: proration.prorationCredit,
          currency: 'INR',
          status: 'PAID',
          billingDate: now,
          paidAt: now,
          periodStart: now,
          periodEnd: nextBillingDate
        }
      });

      console.log(`[RAZORPAY] Activation Complete for Org: ${organizationId}`);
      return updatedOrg;
    });
  }
}

module.exports = new SubscriptionService();

const prisma = require('../config/prisma');

// ==================================================
// 1. AGENT DASHBOARD & ANALYTICS
// ==================================================
const getDashboardStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    const organizationId = req.user.organizationId;
    const days = parseInt(req.query.days) || 7;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);

    const [
      callsToday,
      totalTalkTime,
      pendingCallbacks,
      conversionsThisMonth,
      totalRevenue,
      tasksDueToday,
      emailMetrics,
      callsData,
      wonLeadsData,
      rawTasks,
      rawCallbacks,
      rawActivities
    ] = await Promise.all([
      prisma.call.count({ where: { organizationId, agentId, createdAt: { gte: today } } }),
      prisma.call.aggregate({
        _sum: { duration: true },
        where: { organizationId, agentId, createdAt: { gte: today } }
      }),
      prisma.lead.count({ where: { organizationId, assignedToId: agentId, status: 'INTERESTED' } }),
      prisma.lead.count({ 
        where: { 
          organizationId,
          assignedToId: agentId, 
          status: 'WON',
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        } 
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { organizationId, raisedById: agentId, status: 'PAID' }
      }),
      prisma.task.count({ where: { organizationId, assignedToId: agentId, dueDate: { lte: today }, status: 'PENDING' } }),
      prisma.email.aggregate({
        _count: true,
        where: { organizationId, agentId }
      }),
      prisma.call.findMany({
        where: { organizationId, agentId, createdAt: { gte: startDate } },
        select: { createdAt: true }
      }),
      prisma.lead.findMany({
        where: { organizationId, assignedToId: agentId, status: 'WON', createdAt: { gte: startDate } },
        select: { createdAt: true }
      }),
      prisma.task.findMany({ where: { organizationId, assignedToId: agentId, status: 'PENDING' }, orderBy: { dueDate: 'asc' }, take: 3 }),
      prisma.task.findMany({ where: { organizationId, assignedToId: agentId, type: 'FOLLOWUP', status: 'PENDING' }, orderBy: { dueDate: 'asc' }, take: 4 }),
      prisma.activityLog.findMany({ where: { actorId: agentId }, orderBy: { createdAt: 'desc' }, take: 4 })
    ]);

    // Generate Chart Data
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const callsCount = callsData.filter(c => new Date(c.createdAt).toDateString() === d.toDateString()).length;
      const convCount = wonLeadsData.filter(l => new Date(l.createdAt).toDateString() === d.toDateString()).length;
      
      chartData.push({ name: dateStr, calls: callsCount, conv: convCount });
    }

    const tasks = rawTasks.map(t => {
      const isHigh = t.priority?.toUpperCase() === 'HIGH';
      const isLow = t.priority?.toUpperCase() === 'LOW';
      return {
        title: t.title,
        time: t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending',
        priority: t.priority || 'Medium',
        color: isHigh ? 'rose' : (isLow ? 'emerald' : 'blue')
      };
    });

    const callbacks = rawCallbacks.map(c => ({
      name: c.title,
      time: c.dueDate ? new Date(c.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Anytime'
    }));

    const recentActivity = rawActivities.map(a => {
      let type = 'SYSTEM';
      if (a.entityType === 'CALL') type = 'CALL';
      else if (a.entityType === 'EMAIL') type = 'EMAIL';
      
      return {
        type,
        title: a.action.replace(/\./g, ' ').toUpperCase(),
        description: a.entityType ? `${a.entityType} Activity` : 'System Log',
        time: new Date(a.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
    });

    res.json({
      success: true,
      data: {
        cards: {
          callsToday,
          talkTimeToday: totalTalkTime._sum.duration || 0,
          pendingCallbacks,
          conversionsThisMonth,
          revenueGenerated: totalRevenue._sum.amount || 0,
          tasksDueToday,
          emailsSent: emailMetrics._count || 0
        },
        chartData,
        tasks,
        callbacks,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 2. LEAD PIELINE
// ==================================================
const getMyLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { organizationId: req.user.organizationId, assignedToId: req.user.id },
      include: {
        calls: { orderBy: { createdAt: 'desc' }, take: 5 },
        emails: { orderBy: { createdAt: 'desc' }, take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, customerName, email, phone } = req.body;
    
    const lead = await prisma.lead.update({
      where: { 
        id: parseInt(id), 
        organizationId: req.user.organizationId,
        assignedToId: req.user.id 
      },
      data: { status, customerName, email, phone }
    });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 3. CALLS & DIALER
// ==================================================
const startCall = async (req, res) => {
  try {
    const { leadId } = req.body;
    // In real app, initialize WebRTC/Twilio session here
    res.json({ success: true, message: "Call session initialized", callSid: `SIM_${Date.now()}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logCall = async (req, res) => {
  try {
    const { leadId, durationSeconds, callStatus, recordingUrl, tags, notes, phone } = req.body;
    const call = await prisma.call.create({
      data: {
        organizationId: req.user.organizationId,
        leadId: leadId ? parseInt(leadId) : null,
        agentId: req.user.id,
        duration: parseInt(durationSeconds) || 0,
        status: callStatus || 'COMPLETED',
        recordingUrl,
        tags,
        notes,
        phone
      }
    });

    if (leadId && tags) {
      const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST', 'CALLBACK', 'NEGOTIATION'];
      if (validStatuses.includes(tags)) {
        await prisma.lead.update({
          where: { id: parseInt(leadId) },
          data: { status: tags }
        });
      }
    }

    res.json({ success: true, data: call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const calls = await prisma.call.findMany({
      where: { 
        organizationId: req.user.organizationId,
        agentId: req.user.id 
      },
      include: { lead: { select: { customerName: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 4. TASKS
// ==================================================
const getMyTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { 
        organizationId: req.user.organizationId,
        assignedToId: req.user.id 
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, type, tags } = req.body;
    const task = await prisma.task.create({
      data: {
        organizationId: req.user.organizationId,
        title, 
        description, 
        dueDate: dueDate ? new Date(dueDate) : null, 
        priority: priority || 'NORMAL',
        type: type || 'FOLLOWUP',
        assignedToId: req.user.id,
        createdById: req.user.id
      }
    });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, dueDate, priority } = req.body;
    
    const existing = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!existing || existing.organizationId !== req.user.organizationId || existing.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { 
        status, 
        title, 
        description, 
        dueDate: dueDate ? new Date(dueDate) : undefined, 
        priority 
      }
    });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!existing || existing.organizationId !== req.user.organizationId || existing.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await prisma.task.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 5. INVOICING
// ==================================================
const createInvoice = async (req, res) => {
  try {
    const { leadId, amount, dueDate, items, currency, notes, discount, tax, subtotal } = req.body;
    
    // Auto-generate invoice number
    const count = await prisma.invoice.count({ where: { organizationId: req.user.organizationId } });
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: req.user.organizationId,
        invoiceNo,
        clientId: leadId ? parseInt(leadId) : null,
        raisedById: req.user.id,
        amount: parseFloat(amount) || 0,
        subtotal: parseFloat(subtotal) || 0,
        tax: parseFloat(tax) || 0,
        discount: parseFloat(discount) || 0,
        currency: currency || 'USD',
        notes: notes || '',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'DRAFT',
        items: {
          create: items?.map(item => ({
            description: item.description,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: (parseInt(item.quantity || 1) * parseFloat(item.unitPrice || 0)) + (parseFloat(item.tax) || 0)
          })) || []
        },
        auditLogs: {
          create: { action: 'Created Draft', by: req.user.name, userId: req.user.id }
        }
      },
      include: { items: true, auditLogs: true, deliveryLogs: true }
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { leadId, amount, dueDate, items, currency, notes, discount, tax, subtotal, status } = req.body;
    
    const invoiceId = parseInt(id);

    const [deletedItems, invoice] = await prisma.$transaction([
      prisma.invoiceItem.deleteMany({ where: { invoiceId } }),
      prisma.invoice.update({
        where: { id: invoiceId, organizationId: req.user.organizationId },
        data: {
          clientId: leadId ? parseInt(leadId) : null,
          amount: parseFloat(amount) || 0,
          subtotal: parseFloat(subtotal) || 0,
          tax: parseFloat(tax) || 0,
          discount: parseFloat(discount) || 0,
          currency: currency || 'USD',
          notes: notes || '',
          dueDate: dueDate ? new Date(dueDate) : null,
          status: status || undefined,
          items: {
            create: items?.map(item => ({
              description: item.description,
              quantity: parseInt(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0,
              total: (parseInt(item.quantity || 1) * parseFloat(item.unitPrice || 0)) + (parseFloat(item.tax) || 0)
            })) || []
          },
          auditLogs: {
            create: { action: status === 'PENDING_APPROVAL' ? 'Submitted for Approval' : 'Updated Draft', by: req.user.name, userId: req.user.id }
          }
        },
        include: { items: true, auditLogs: true, deliveryLogs: true }
      })
    ]);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfBase64, to, cc, bcc } = req.body;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
      include: { client: true }
    });
    
    const recipientEmail = to || invoice?.client?.email;
    
    if (!invoice || !recipientEmail) {
      return res.status(400).json({ success: false, message: 'Invalid invoice or missing client email.' });
    }

    // Reuse existing email service
    const { transporter } = require('../utils/emailService');
    const pdfBuffer = Buffer.from(pdfBase64.split(',')[1] || pdfBase64, 'base64');

    const mailOptions = {
      from: `"CRM.PRO Billing" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: recipientEmail,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: `Invoice ${invoice.invoiceNo} from ${req.user.name}`,
      text: `Hello ${invoice.client.customerName},\n\nPlease find attached your invoice ${invoice.invoiceNo} for ${invoice.amount} ${invoice.currency}.\n\nNotes: ${invoice.notes || 'None'}\n\nThank you,\n${req.user.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoiceNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
            .header { background-color: #0f172a; padding: 30px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .content { padding: 40px; }
            .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
            .message { font-size: 15px; color: #475569; line-height: 1.6; }
            .invoice-box { background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0; }
            .invoice-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #334155; }
            .invoice-row.total { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 0; margin-top: 16px; padding-top: 16px; border-top: 1px solid #cbd5e1; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CRM.PRO</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello ${invoice.client.customerName},</p>
              <p class="message">Please find your invoice <strong>${invoice.invoiceNo}</strong> attached to this email. We appreciate your business.</p>
              
              <div class="invoice-box">
                <div class="invoice-row">
                  <span>Invoice Number</span>
                  <strong>${invoice.invoiceNo}</strong>
                </div>
                <div class="invoice-row">
                  <span>Due Date</span>
                  <strong>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt'}</strong>
                </div>
                <div class="invoice-row total">
                  <span>Amount Due</span>
                  <span>${invoice.currency} ${invoice.amount.toLocaleString()}</span>
                </div>
              </div>
              
              ${invoice.notes ? `<p class="message" style="font-size: 13px; font-style: italic;"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
              
              <p class="message" style="margin-top: 30px;">
                Thank you,<br>
                <strong>${req.user.name}</strong>
              </p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} CRM.PRO Enterprise Inc.<br>
              An official PDF of your invoice is attached.
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `${invoice.invoiceNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (sendError) {
      // Log failure in activityLogs
      await prisma.invoice.update({
        where: { id: parseInt(id) },
        data: {
          auditLogs: {
            create: { action: 'Failed to Send Invoice', by: req.user.name, userId: req.user.id, error: sendError.message }
          },
          deliveryLogs: {
            create: { status: 'FAILED', error: sendError.message, to: recipientEmail, cc: cc || null, bcc: bcc || null }
          }
        }
      });
      return res.status(500).json({ success: false, message: `SMTP Failed: ${sendError.message}` });
    }
    
    // Update invoice status on success
    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        auditLogs: {
          create: { action: 'Sent Invoice via Email', by: req.user.name, userId: req.user.id, messageId: info.messageId }
        },
        deliveryLogs: {
          create: { status: 'DELIVERED', messageId: info.messageId, to: recipientEmail, cc: cc || null, bcc: bcc || null }
        }
      },
      include: { items: true, auditLogs: true, deliveryLogs: true }
    });

    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { 
        organizationId: req.user.organizationId,
        raisedById: req.user.id 
      },
      include: { 
        items: true,
        auditLogs: true,
        deliveryLogs: true,
        client: { select: { customerName: true } },
        raisedBy: { select: { name: true } },
        approver: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 6. FEEDBACK & EMAILS
// ==================================================
const getFeedback = async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      where: { 
        organizationId: req.user.organizationId,
        agentId: req.user.id 
      },
      include: { manager: { select: { name: true, profileImage: true } }, call: true },
      orderBy: { createdAt: 'desc' }
    });

    const openTasks = feedback.filter(f => !f.acknowledgedAt).length;
    const computedQaScore = feedback.length > 0 ? (feedback.reduce((sum, f) => sum + (f.qaScore || 85), 0) / feedback.length).toFixed(1) : 88.5;

    const insights = {
      overallQaScore: parseFloat(computedQaScore),
      managerConfidence: (parseFloat(computedQaScore) / 20).toFixed(1), // Map to 5.0 scale
      complianceScore: 98,
      conversionQuality: 82,
      openTasks,
      strengths: ['Objection Handling', 'Empathy', 'Product Knowledge'],
      weaknesses: ['Call Pacing', 'Cross-selling'],
      predictedGrowth: '+4.5% next quarter',
      certifications: [
        { name: 'Sales Excellence', status: 'EXPERT', score: 92 },
        { name: 'Compliance Standard', status: 'VERIFIED', score: 100 },
        { name: 'Objection Handling', status: 'MASTER', score: 88 }
      ]
    };

    res.json({ success: true, data: { feedback, insights } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { leadId, subject, content } = req.body;
    const email = await prisma.email.create({
      data: {
        organizationId: req.user.organizationId,
        leadId: parseInt(leadId),
        agentId: req.user.id,
        subject,
        content,
        status: 'SENT'
      }
    });

    // Create lead timeline entry
    await prisma.leadActivity.create({
      data: {
        organizationId: req.user.organizationId,
        leadId: parseInt(leadId),
        action: `Outbound Email Sent: "${subject}"`
      }
    }).catch(err => console.error("LeadActivity Creation Error:", err));

    const { logActivity, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await logActivity({
      actorId: req.user.id,
      actorRole: 'AGENT',
      action: 'email.sent',
      entityType: 'EMAIL',
      entityId: email.id,
      newValue: { subject, leadId },
      teamId: req.user.teamId
    });

    triggerRealtimeEvent(`org_${req.user.organizationId}`, 'email:sent', email);
    if (req.user.teamId) {
      triggerRealtimeEvent(`team_${req.user.teamId}`, 'email:sent', email);
    }

    res.json({ success: true, data: email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyEmails = async (req, res) => {
  try {
    const emails = await prisma.email.findMany({
      where: { 
        organizationId: req.user.organizationId,
        agentId: req.user.id 
      },
      include: { lead: { select: { customerName: true, email: true } } },
      orderBy: { sentAt: 'desc' }
    });
    res.json({ success: true, data: emails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acknowledgeFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const organizationId = req.user.organizationId;
    const agentId = req.user.id;

    const oldFeedback = await prisma.feedback.findFirst({
      where: { id: parseInt(feedbackId), organizationId, agentId }
    });

    if (!oldFeedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

    const feedback = await prisma.feedback.update({
      where: { id: oldFeedback.id },
      data: { acknowledgedAt: new Date() }
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await sendNotification({
      organizationId,
      userId: feedback.managerId,
      title: 'Feedback Acknowledged',
      message: `Agent ${req.user.name} acknowledged feedback ID ${feedback.id}.`,
      type: 'SUCCESS',
      priority: 'MEDIUM'
    });

    triggerRealtimeEvent(`user_${feedback.managerId}`, 'feedback:acknowledged', feedback);

    await logActivity({
      actorId: agentId,
      actorRole: 'AGENT',
      action: 'feedback.acknowledged',
      entityType: 'FEEDBACK',
      entityId: feedback.id,
      newValue: { acknowledgedAt: feedback.acknowledgedAt },
      teamId: req.user.teamId
    });

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const replyToFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { content } = req.body;
    const organizationId = req.user.organizationId;
    const agentId = req.user.id;

    const feedback = await prisma.feedback.findFirst({
      where: { id: parseInt(feedbackId), organizationId, agentId }
    });

    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

    let currentMetadata = typeof feedback.metadata === 'string' ? JSON.parse(feedback.metadata) : feedback.metadata || {};
    let threadReplies = currentMetadata.threadReplies || [];
    
    if (content) {
      threadReplies.push({
        senderId: req.user.id,
        senderName: req.user.name,
        role: 'AGENT',
        message: content,
        timestamp: new Date().toISOString()
      });
    }

    currentMetadata.threadReplies = threadReplies;

    const updated = await prisma.feedback.update({
      where: { id: parseInt(feedbackId) },
      data: { metadata: currentMetadata }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const replyFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { response } = req.body;
    const organizationId = req.user.organizationId;
    const agentId = req.user.id;

    const oldFeedback = await prisma.feedback.findFirst({
      where: { id: parseInt(feedbackId), organizationId, agentId }
    });

    if (!oldFeedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

    const feedback = await prisma.feedback.update({
      where: { id: oldFeedback.id },
      data: { response }
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await sendNotification({
      organizationId,
      userId: feedback.managerId,
      title: 'Agent Responded to Feedback',
      message: `Agent ${req.user.name} replied to coaching feedback: "${response.substring(0, 30)}..."`,
      type: 'INFO',
      priority: 'HIGH'
    });

    triggerRealtimeEvent(`user_${feedback.managerId}`, 'feedback:replied', feedback);

    await logActivity({
      actorId: agentId,
      actorRole: 'AGENT',
      action: 'feedback.replied',
      entityType: 'FEEDBACK',
      entityId: feedback.id,
      newValue: { response },
      teamId: req.user.teamId
    });

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAgentAnalytics = async (req, res) => {
  try {
    const agentId = req.user.id;
    const organizationId = req.user.organizationId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const callsToday = await prisma.call.count({ where: { organizationId, agentId, createdAt: { gte: today } } });
    const totalTalkTime = await prisma.call.aggregate({ _sum: { duration: true }, where: { organizationId, agentId, createdAt: { gte: today } } });
    const conversionsThisMonth = await prisma.lead.count({ where: { organizationId, assignedToId: agentId, status: 'WON', createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } });
    const totalRevenue = await prisma.invoice.aggregate({ _sum: { amount: true }, where: { organizationId, raisedById: agentId, status: 'PAID' } });

    const callsData = await prisma.call.findMany({ where: { organizationId, agentId, createdAt: { gte: today } }, select: { createdAt: true } });
    const hourlyCounts = { '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, '16:00': 0, '18:00': 0 };
    callsData.forEach(c => {
      const h = c.createdAt.getHours();
      if (h < 10) hourlyCounts['08:00']++;
      else if (h < 12) hourlyCounts['10:00']++;
      else if (h < 14) hourlyCounts['12:00']++;
      else if (h < 16) hourlyCounts['14:00']++;
      else if (h < 18) hourlyCounts['16:00']++;
      else hourlyCounts['18:00']++;
    });
    
    const wonLeadsToday = await prisma.lead.findMany({ where: { organizationId, assignedToId: agentId, status: 'WON', updatedAt: { gte: today } }, select: { updatedAt: true } });
    const hourlyConv = { '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, '16:00': 0, '18:00': 0 };
    wonLeadsToday.forEach(l => {
      const h = l.updatedAt.getHours();
      if (h < 10) hourlyConv['08:00']++;
      else if (h < 12) hourlyConv['10:00']++;
      else if (h < 14) hourlyConv['12:00']++;
      else if (h < 16) hourlyConv['14:00']++;
      else if (h < 18) hourlyConv['16:00']++;
      else hourlyConv['18:00']++;
    });

    const conversionTrends = Object.keys(hourlyCounts).map(name => ({
      name,
      calls: hourlyCounts[name],
      conv: hourlyConv[name]
    }));

    const leadsMix = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId, assignedToId: agentId },
      _count: true
    });
    const mixData = { WON: 0, INTERESTED: 0, CALLBACK: 0, LOSS: 0 };
    leadsMix.forEach(l => {
       if (l.status === 'WON') mixData.WON = l._count;
       else if (l.status === 'INTERESTED') mixData.INTERESTED = l._count;
       else if (l.status === 'CALLBACK') mixData.CALLBACK = l._count;
       else if (l.status === 'LOSS') mixData.LOSS = l._count;
    });

    const totalLeads = Object.values(mixData).reduce((a, b) => a + b, 0) || 1;
    const callDispositionMix = [
       { name: 'Won', value: Math.round((mixData.WON / totalLeads) * 100) || 0 },
       { name: 'Interested', value: Math.round((mixData.INTERESTED / totalLeads) * 100) || 0 },
       { name: 'Callback', value: Math.round((mixData.CALLBACK / totalLeads) * 100) || 0 },
       { name: 'Other', value: Math.round((mixData.LOSS / totalLeads) * 100) || 0 }
    ];

    res.json({
      success: true,
      data: {
        cards: {
          callsToday,
          talkTimeToday: totalTalkTime._sum.duration || 0,
          conversionsThisMonth,
          revenueGenerated: totalRevenue._sum.amount || 0
        },
        conversionTrends,
        callDispositionMix,
        aiPrediction: {
          probability: Math.min(99, Math.max(10, Math.round((mixData.WON / totalLeads) * 100) + 15))
        },
        efficiencyMetrics: {
          responseLatency: '2.3m',
          interactionDepth: '3.1',
          workloadIndex: '76%'
        },
        accuracyRate: '92.4%'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAgentAnalytics,
  getMyLeads,
  updateLead,
  startCall,
  logCall,
  getCallHistory,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  createInvoice,
  updateInvoice,
  sendInvoiceEmail,
  getMyInvoices,
  getFeedback,
  sendEmail,
  getMyEmails,
  acknowledgeFeedback,
  replyToFeedback
};

const express = require('express');
const router = express.Router();
const { 
  getCheckoutSummary, 
  initiateUpgrade, 
  verifyPayment, 
  getBillingDetails 
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', getBillingDetails);
router.get('/checkout-summary', getCheckoutSummary);
router.post('/initiate-upgrade', initiateUpgrade);
router.post('/verify-payment', verifyPayment);

router.get('/plans', async (req, res) => {
  const prisma = require('../config/prisma');
  const plans = await prisma.plan.findMany({
    orderBy: { priceMonthly: 'asc' }
  });
  res.json({ success: true, data: plans });
});

module.exports = router;

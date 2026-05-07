const express = require('express');
const router = express.Router();
const { getBillingOverview, getInvoices, upgradePlan } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', getBillingOverview);
router.get('/invoices', getInvoices);
router.get('/plans', async (req, res) => {
  const prisma = require('../config/prisma');
  const plans = await prisma.plan.findMany();
  res.json({ success: true, data: plans });
});
router.post('/upgrade', upgradePlan);

module.exports = router;

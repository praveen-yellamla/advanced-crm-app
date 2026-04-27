const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here require Manager role
router.use(protect);
router.use(authorize('MANAGER', 'ADMIN'));

// Dashboard
router.get('/dashboard', managerController.getDashboardStats);

// Leads
router.get('/leads', managerController.getTeamLeads);
router.post('/leads/assign', managerController.assignLead);

// Calls & QA
router.get('/calls', managerController.getTeamCalls);
router.post('/qa/score', managerController.submitQA);

// Invoices
router.get('/invoices', managerController.getTeamInvoices);
router.patch('/invoices/:id/status', managerController.updateInvoiceStatus);

// Agents & Coaching
router.get('/agents', managerController.getTeamAgents);
router.post('/feedback', managerController.sendFeedback);

// Reports
router.get('/reports/pdf', managerController.exportPDF);
router.get('/reports/excel', managerController.exportExcel);

module.exports = router;

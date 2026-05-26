const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const taskController = require('../controllers/taskController');
const invoiceController = require('../controllers/invoiceController');
const integrationController = require('../controllers/integrationController');
const trackingController = require('../controllers/trackingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================================================
// PUBLIC ENDPOINTS
// ==================================================
router.post('/public/webhook/lead', integrationController.handleWebLead);
router.get('/public/track/open/:id', trackingController.trackEmailOpen);
router.get('/public/track/click/:id', trackingController.trackLinkClick);

// ==================================================
// PROTECTED ENDPOINTS
// ==================================================
router.use(protect);

const upload = require('../middleware/upload');

// Lead Engine
router.get('/leads', leadController.getLeads);
router.get('/leads/analytics', leadController.getLeadAnalytics);
router.get('/leads/:id', leadController.getLeadDetails);
router.post('/leads', upload.single('image'), leadController.createLead);
router.put('/leads/:id', leadController.updateLead);
router.patch('/leads/:id/status', leadController.updateLeadStatus);
router.patch('/leads/:id/assign', authorize('ADMIN', 'MANAGER'), leadController.assignLead);
router.put('/leads/:id/assign', authorize('ADMIN', 'MANAGER'), leadController.assignLead);
router.delete('/leads/:id', leadController.deleteLead);
router.post('/leads/merge', leadController.mergeLeads);

// Task Orchestration
router.get('/tasks', taskController.getTasks);
router.get('/tasks/analytics', taskController.getTaskAnalytics);
router.get('/tasks/:id', taskController.getTaskById);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.patch('/tasks/:id/status', taskController.patchTaskStatus);
router.delete('/tasks/:id', taskController.deleteTask);

// Fiscal Engineering (Invoices)
router.get('/invoices', invoiceController.getInvoices);
router.post('/invoices', invoiceController.createInvoice);
router.get('/invoices/:id/pdf', invoiceController.generatePDF);

// Integrations & Bulk Operations
router.get('/integrations', authorize('ADMIN'), integrationController.getIntegrations);
router.post('/imports/csv', authorize('ADMIN', 'MANAGER'), upload.single('file'), integrationController.uploadCSV);

module.exports = router;

const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here require Agent role
router.use(protect);
router.use(authorize('AGENT', 'ADMIN'));

// Dashboard
router.get('/dashboard', agentController.getDashboardStats);

// Leads & Pipeline
router.get('/leads', agentController.getMyLeads);
router.patch('/leads/:id', agentController.updateLead);

// Dialer & Calls
router.post('/call/start', agentController.startCall);
router.post('/call/log', agentController.logCall);
router.get('/calls', agentController.getCallHistory);

// Tasks
router.get('/tasks', agentController.getMyTasks);
router.post('/tasks', agentController.createTask);
router.patch('/tasks/:id', agentController.updateTask);
router.delete('/tasks/:id', agentController.deleteTask);

// Invoices
router.get('/invoices', agentController.getMyInvoices);
router.post('/invoices', agentController.createInvoice);

// Feedback & Monitoring
router.get('/feedback', agentController.getFeedback);

// Emails
router.get('/emails', agentController.getMyEmails);
router.post('/emails/send', agentController.sendEmail);

module.exports = router;

const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and MANAGER role (or ADMIN as supervisor)
router.use(protect);
router.use(authorize('MANAGER', 'ADMIN'));

// 1. Dashboard Overview
router.get('/dashboard/stats', managerController.getDashboardStats);
router.get('/dashboard/call-volume', managerController.getDashboardCallVolume);
router.get('/dashboard/lead-sources', managerController.getDashboardLeadSources);
router.get('/dashboard/conversion-funnel', managerController.getDashboardConversionFunnel);

// 2. Team Analytics
router.get('/analytics', managerController.getTeamAnalytics);
router.get('/analytics/talk-time', managerController.getTalkTimeHeatmap);
router.get('/analytics/conversion-comparison', managerController.getConversionComparison);

// 3. Call Recordings & QC
router.get('/calls', managerController.getTeamCalls);
router.post('/calls/:callId/annotate', managerController.annotateCall);
router.post('/calls/:callId/flag', managerController.flagCall);

// 4. QA Scoring
router.get('/qa/pending', managerController.getQAPending);
router.post('/qa/:callId/score', managerController.submitQAScore);
router.get('/qa/reports', managerController.getQAReports);

// 5. Agent Feedback
router.get('/feedback/:agentId', managerController.getAgentFeedback);
router.post('/feedback', managerController.submitAgentFeedback);

// 6. Lead Management
router.get('/leads', managerController.getTeamLeads);
router.patch('/leads/:leadId/reassign', managerController.reassignLead);

// 7. Tasks & Activities
router.get('/tasks', managerController.getTeamTasks);
router.patch('/tasks/:taskId/reassign', managerController.reassignTask);

// 8. Email Monitoring
router.get('/emails', managerController.getTeamEmails);

// 9. Invoicing
router.get('/invoices', managerController.getTeamInvoices);
router.patch('/invoices/:id/status', managerController.updateInvoiceStatus);

// 10. Core Team & Agents List
router.get('/agents', managerController.getTeamAgents);
router.get('/team', managerController.getTeamDetails);

module.exports = router;

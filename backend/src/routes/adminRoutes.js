const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getTeams, 
  createTeam, 
  updateTeam,
  deleteTeam,
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  getAuditLogs,
  getManagers,
  assignAgentTeam
} = require('../controllers/adminController');
const { 
  getInvoices, 
  createInvoice, 
  getCalls,
  getAnalytics,
  exportAnalytics,
  getEmailLogs
} = require('../controllers/adminExtraController');
const { 
  inviteUser, 
  getInvites, 
  getInviteStats, 
  deleteInvite, 
  resendInvite,
  bulkDeleteInvites 
} = require('../controllers/inviteController');
const {
  getIntegrations,
  connectMeta
} = require('../controllers/integrationController');
const {
  inviteSingleAgent,
  inviteBulkAgents,
  inviteCsvAgents,
  getInvitations,
  resendInvitation,
  cancelInvitation
} = require('../controllers/agentInvitationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here are protected and require ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);

router.route('/teams')
  .get(getTeams)
  .post(createTeam);

router.route('/teams/:id')
  .put(updateTeam)
  .delete(deleteTeam);

const upload = require('../middleware/upload');

router.route('/agents')
  .get(getAgents)
  .post(upload.single('image'), createAgent);

router.route('/agents/:id')
  .put(upload.single('image'), updateAgent)
  .delete(deleteAgent);

router.patch('/agents/:id/assign-team', assignAgentTeam);

router.post('/agents/invite-single', inviteSingleAgent);
router.post('/agents/invite-bulk', inviteBulkAgents);
router.post('/agents/invite-csv', upload.single('file'), inviteCsvAgents);
router.get('/agents/invitations', getInvitations);
router.post('/agents/invitations/:invitationId/resend', resendInvitation);
router.delete('/agents/invitations/:invitationId', cancelInvitation);

router.get('/audit', getAuditLogs);
router.get('/audit-logs', getAuditLogs);

router.get('/managers', getManagers);


router.get('/invite-stats', getInviteStats);
router.post('/invites/bulk-delete', bulkDeleteInvites);
router.route('/invites')
  .get(getInvites)
  .post(inviteUser);

router.post('/invite-agent', inviteUser);

router.post('/invites/:id/resend', resendInvite);
router.delete('/invites/:id', deleteInvite);

router.route('/invoices')
  .get(getInvoices)
  .post(createInvoice);

router.get('/calls', getCalls);
router.get('/emails', getEmailLogs);
router.get('/analytics', getAnalytics);
router.post('/analytics/export', exportAnalytics);

router.get('/integrations', getIntegrations);
router.post('/integrations/meta', connectMeta);

module.exports = router;

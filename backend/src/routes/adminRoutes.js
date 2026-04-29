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
  getManagers
} = require('../controllers/adminController');
const { 
  getInvoices, 
  createInvoice, 
  getCalls 
} = require('../controllers/adminExtraController');
const { 
  inviteUser, 
  getInvites, 
  getInviteStats, 
  deleteInvite, 
  bulkDeleteInvites 
} = require('../controllers/inviteController');
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

router.get('/audit-logs', getAuditLogs);

router.get('/managers', getManagers);


router.get('/invite-stats', getInviteStats);
router.post('/invites/bulk-delete', bulkDeleteInvites);
router.route('/invites')
  .get(getInvites)
  .post(inviteUser);

router.post('/invite-agent', inviteUser);

router.delete('/invites/:id', deleteInvite);

router.route('/invoices')
  .get(getInvoices)
  .post(createInvoice);

router.get('/calls', getCalls);

module.exports = router;

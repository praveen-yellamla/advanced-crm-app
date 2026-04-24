const express = require('express');
const router = express.Router();
const { 
  createTeam, 
  getTeams, 
  updateTeam, 
  deleteTeam,
  createAgent,
  getAgents,
  updateAgent,
  deleteAgent,
  sendInvite
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here are protected and require ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Team Routes
router.route('/teams')
  .post(createTeam)
  .get(getTeams);

router.route('/teams/:id')
  .put(updateTeam)
  .delete(deleteTeam);

// Agent Routes
router.route('/agents')
  .post(createAgent)
  .get(getAgents);

router.route('/agents/:id')
  .put(updateAgent)
  .delete(deleteAgent);

// Invite Route
router.post('/invite', sendInvite);

module.exports = router;

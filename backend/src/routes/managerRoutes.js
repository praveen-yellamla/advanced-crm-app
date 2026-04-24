const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Manager and Admin can access
router.get('/team', protect, authorize('ADMIN', 'MANAGER'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Team performance data',
    team: ['Agent 1', 'Agent 2', 'Agent 3']
  });
});

module.exports = router;

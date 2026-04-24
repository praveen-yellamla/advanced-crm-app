const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All roles can access leads
router.get('/leads', protect, authorize('ADMIN', 'MANAGER', 'AGENT'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Your assigned leads',
    leads: [
      { id: 1, customer: 'John Doe', status: 'New' },
      { id: 2, customer: 'Jane Smith', status: 'Contacted' }
    ]
  });
});

module.exports = router;

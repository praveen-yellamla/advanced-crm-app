const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, authorize('ADMIN'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Admin Dashboard',
    data: {
      stats: { users: 10, revenue: 50000, leads: 150 }
    }
  });
});

router.post('/create-user', protect, authorize('ADMIN'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Admin specialized user creation endpoint'
  });
});

module.exports = router;

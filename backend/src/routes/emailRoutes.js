const express = require('express');
const router = express.Router();
const { 
  connectAccount, 
  sendEmail, 
  getInbox, 
  syncEmails 
} = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/connect', connectAccount);
router.post('/send', sendEmail);
router.get('/inbox', getInbox);
router.post('/sync', syncEmails);

module.exports = router;

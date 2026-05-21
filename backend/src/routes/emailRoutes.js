const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');

const {
  connectAccount,
  getAccountStatus,
  disconnectAccount,
  syncEmails,
  sendEmail,
  saveDraft,
  toggleStar,
  toggleReadStatus,
  archiveEmail,
  deleteEmail,
  getAiWritingAssist
} = require('../controllers/emailController');

router.use(protect);

// Account Connection
router.post('/connect', connectAccount);
router.get('/status', getAccountStatus);
router.post('/disconnect', disconnectAccount);
router.post('/sync', syncEmails);

// Message Actions
router.post('/send', upload.array('attachments', 5), sendEmail);
router.post('/draft', saveDraft);
router.put('/star', toggleStar);
router.put('/read', toggleReadStatus);
router.put('/archive', archiveEmail);
router.delete('/:id', deleteEmail);

// AI Assistance
router.post('/ai-assist', getAiWritingAssist);

module.exports = router;

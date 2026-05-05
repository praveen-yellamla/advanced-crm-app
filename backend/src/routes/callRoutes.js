const express = require('express');
const router = express.Router();
const { 
  getCallToken, 
  initiateOutgoingCall, 
  handleVoiceWebhook, 
  handleStatusWebhook, 
  handleRecordingWebhook,
  tagCall,
  getCallHistory,
  monitorCall,
  getActiveCalls
} = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

// PUBLIC WEBHOOKS (Called by Twilio)
router.post('/voice', handleVoiceWebhook);
router.post('/webhook/voice', handleVoiceWebhook);
router.post('/webhook/status', handleStatusWebhook);
router.post('/webhook/recording', handleRecordingWebhook);

// PROTECTED API ENDPOINTS
router.use(protect);

router.get('/token', getCallToken);
router.post('/outgoing', initiateOutgoingCall);
router.post('/tag', tagCall);
router.get('/history/:agentId', getCallHistory);
router.get('/monitor', monitorCall);
router.get('/active', getActiveCalls);

module.exports = router;

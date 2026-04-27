const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Admin Controls
router.get('/settings', authorize('ADMIN'), aiController.getAISettings);
router.patch('/settings', authorize('ADMIN'), aiController.updateAISettings);
router.get('/usage', authorize('ADMIN'), aiController.getAIUsage);

// Intelligence Operations
router.post('/lead/score/:leadId', aiController.scoreLead);
router.post('/lead/summary/:leadId', aiController.summarizeLead);
router.post('/call/transcribe/:callId', aiController.transcribeCall);
router.post('/query', aiController.processNLQuery);

module.exports = router;

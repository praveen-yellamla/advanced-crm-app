const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// ========================================
// ADMIN: AI Configuration & Orchestration
// ========================================
router.get('/settings', authorize('ADMIN'), aiController.getAISettings);
router.patch('/settings', authorize('ADMIN'), aiController.updateAISetting);
router.post('/validate-key', authorize('ADMIN'), aiController.validateAPIKey);
router.get('/status', authorize('ADMIN'), aiController.getAIStatus);
router.get('/usage', authorize('ADMIN'), aiController.getAIUsage);

// ========================================
// ALL USERS: Strategic Intelligence
// ========================================
router.post('/query', aiController.chatAssistant);
router.post('/chat', aiController.chatAssistant);
router.get('/history', aiController.getChatHistory);
router.post('/lead/score/:leadId', aiController.getLeadScore);

module.exports = router;

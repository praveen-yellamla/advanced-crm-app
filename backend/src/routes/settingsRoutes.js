const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/category/:category', settingsController.getSettingsByCategory);
router.get('/company', settingsController.getCompanyProfile);
router.patch('/', settingsController.updateSetting);
router.post('/test/:type', settingsController.testConnection);

module.exports = router;

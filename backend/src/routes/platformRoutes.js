const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { 
  getPlatformStats, 
  getOrganizations, 
  getOrganizationDetails,
  createOrganization,
  updateOrganization,
  getPlans,
  upsertPlan
} = platformController;
const { protect, authorize } = require('../middleware/authMiddleware');

// ALL PLATFORM ROUTES ARE PROTECTED
router.use(protect);

router.get('/stats', authorize('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'PLATFORM_BILLING'), getPlatformStats);
router.get('/organizations', authorize('SUPER_ADMIN', 'PLATFORM_SUPPORT'), getOrganizations);
router.get('/organizations/:id', authorize('SUPER_ADMIN', 'PLATFORM_SUPPORT'), getOrganizationDetails);
router.post('/organizations', authorize('SUPER_ADMIN'), createOrganization);
router.patch('/organizations/:id', authorize('SUPER_ADMIN'), updateOrganization);
router.post('/organizations/:id/access', authorize('SUPER_ADMIN', 'PLATFORM_SUPPORT'), platformController.accessWorkspace);
router.delete('/organizations/:id', authorize('SUPER_ADMIN'), platformController.deleteOrganization);
router.get('/plans', authorize('SUPER_ADMIN', 'PLATFORM_SUPPORT', 'PLATFORM_BILLING'), getPlans);
router.get('/health', authorize('SUPER_ADMIN', 'PLATFORM_SUPPORT'), platformController.getPlatformHealth);
router.post('/plans', authorize('SUPER_ADMIN'), upsertPlan);

module.exports = router;

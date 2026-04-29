const express = require('express');
const router = express.Router();
const { 
  initiateGoogleAuth, 
  googleCallback, 
  getGoogleStatus,
  testGoogleIntegration,
  disconnectGoogle,
  fetchGoogleLeads 
} = require('../controllers/googleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// 1. Initiate OAuth (Public redirect but intended for Admin)
router.get('/', initiateGoogleAuth);

// 2. Callback (Public - hit by Google)
router.get('/callback', googleCallback);

// 3. Status (Protected - Admin only)
router.get('/status', protect, authorize('ADMIN'), getGoogleStatus);

// 4. Test (Protected - Admin only)
router.get('/test', protect, authorize('ADMIN'), testGoogleIntegration);

// 5. Disconnect (Protected - Admin only)
router.delete('/disconnect', protect, authorize('ADMIN'), disconnectGoogle);

// 6. Fetch Leads (Protected - Admin only)
router.get('/fetch-leads', protect, authorize('ADMIN'), fetchGoogleLeads);

module.exports = router;

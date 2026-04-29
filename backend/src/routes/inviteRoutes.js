const express = require('express');
const router = express.Router();
const { verifyInvite, acceptInvite } = require('../controllers/authController');
const upload = require('../middleware/upload');

/**
 * Public Invitation Routes
 * Mounted at /api/invite
 */

// GET /api/invite/:token - Verify token
router.get('/:token', verifyInvite);

// POST /api/invite/accept - Complete signup
router.post('/accept', upload.single('image'), acceptInvite);

module.exports = router;

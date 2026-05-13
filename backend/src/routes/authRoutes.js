const express = require('express');
const {
  register,
  login,
  getMe,
  getSessions,
  revokeSession,
  changePassword,
  logout,
  refresh,
  verifyInvite,
  acceptInvite
} = require('../controllers/authController');
const {
  registerValidationRules,
  loginValidationRules,
  changePasswordValidationRules,
  validate
} = require('../validators/authValidator');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * Public Routes
 */
router.post('/register', registerValidationRules(), validate, register);
router.post('/login', loginValidationRules(), validate, login);
router.post('/refresh', refresh);
router.get('/invite/:token', verifyInvite);
router.post('/accept-invite', upload.single('image'), acceptInvite);

/**
 * Private Routes
 */
router.get('/me', protect, getMe);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.post('/change-password', protect, changePasswordValidationRules(), validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;

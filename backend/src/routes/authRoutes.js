const express = require('express');
const {
  register,
  login,
  getMe,
  changePassword,
  logout,
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

const router = express.Router();

/**
 * Public Routes
 */
router.post('/register', registerValidationRules(), validate, register);
router.post('/login', loginValidationRules(), validate, login);
router.get('/invite/:token', verifyInvite);
router.post('/accept-invite', acceptInvite);

/**
 * Private Routes
 */
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePasswordValidationRules(), validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;

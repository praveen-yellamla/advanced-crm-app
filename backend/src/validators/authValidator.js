const { body, validationResult } = require('express-validator');

/**
 * Handle validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(422).json({
    status: 'error',
    errors: extractedErrors,
  });
};

/**
 * Registration validation rules
 */
const registerValidationRules = () => {
  return [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'MANAGER', 'AGENT'])
      .withMessage('Invalid role'),
  ];
};

/**
 * Login validation rules
 */
const loginValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ];
};

/**
 * Change password validation rules
 */
const changePasswordValidationRules = () => {
  return [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ];
};

module.exports = {
  validate,
  registerValidationRules,
  loginValidationRules,
  changePasswordValidationRules
};

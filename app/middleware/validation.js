const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['admin', 'doctor', 'patient']).withMessage('Invalid role'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().withMessage('Password is required'),
  handleValidationErrors
];

const validateAppointment = [
  body('patient').isMongoId().withMessage('Valid patient ID required'),
  body('doctor').isMongoId().withMessage('Valid doctor ID required'),
  body('dateTime').isISO8601().withMessage('Valid date and time required'),
  body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required'),
  body('type').optional().isIn(['consultation', 'follow-up', 'check-up', 'emergency']),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateAppointment,
  handleValidationErrors
};
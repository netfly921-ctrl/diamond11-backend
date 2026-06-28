const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array().map(err => err.msg)
    });
  }
  next();
};

const loginValidation = [
  body('phone').optional().isMobilePhone('en-IN').withMessage('Invalid phone number').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('uid').optional().isString().withMessage('UID must be a string'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const registerValidation = [
  body('phone').isMobilePhone('en-IN').withMessage('Invalid phone number').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('referralCode').optional().isString().withMessage('Referral code must be a string'),
  handleValidationErrors
];

const depositValidation = [
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₹100'),
  body('transactionId').isString().isLength({ min: 5 }).withMessage('Invalid transaction ID'),
  body('upiId').isString().withMessage('UPI ID is required'),
  handleValidationErrors
];

const withdrawValidation = [
  body('amount').isFloat({ min: 200, max: 10000 }).withMessage('Amount must be between ₹200 and ₹10,000'),
  body('accountName').isString().isLength({ min: 3 }).withMessage('Account name is required'),
  body('accountNumber').isString().isLength({ min: 9, max: 18 }).withMessage('Invalid account number'),
  body('ifsc').isString().isLength({ min: 11, max: 11 }).withMessage('Invalid IFSC code'),
  handleValidationErrors
];

const betValidation = [
  body('gameCode').isString().isIn(['aviator', 'mines', 'wingo']).withMessage('Invalid game code'),
  body('betAmount').isFloat({ min: 10 }).withMessage('Minimum bet is ₹10'),
  handleValidationErrors
];

module.exports = {
  loginValidation,
  registerValidation,
  depositValidation,
  withdrawValidation,
  betValidation,
  handleValidationErrors
};
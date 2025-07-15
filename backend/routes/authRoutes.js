// backend/routes/authRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../utils/authMiddleware'); // CORRECTED PATH

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

const validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('nic').trim().isLength({ min: 10 }).withMessage('NIC must be at least 10 characters'),
  body('telNo').trim().isMobilePhone('any').withMessage('Please provide a valid telephone number'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('vehicleNo').trim().notEmpty().withMessage('Vehicle number is required'),
  body('vehicleType').isIn(['car', 'van', 'bike', 'wheel']).withMessage('Invalid vehicle type'),
  body('permitType').isIn(['day', 'week', 'month', 'annual']).withMessage('Invalid permit type'),
  body('empID').custom((value, { req }) => {
    if (req.body.userType === 'employee' && (!value || value.length < 3)) {
      throw new Error('Employee ID is required and must be at least 3 characters for employees');
    }
    return true;
  })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('userType').isIn(['employee', 'admin', 'visitor', 'nonemployee']).withMessage('Invalid user type'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post('/register', authLimiter, validateRegister, handleValidationErrors, authController.register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;
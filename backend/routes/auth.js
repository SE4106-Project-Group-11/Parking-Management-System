const express = require('express');
const router = express.Router();

const { register, login, getDashboardData } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/dashboard', protect(), getDashboardData);  // Call `protect()` to invoke the middleware function

module.exports = router;

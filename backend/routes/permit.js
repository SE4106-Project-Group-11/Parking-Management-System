// backend/routes/permit.js 
const express = require('express');
const router = express.Router();

const { authenticateToken, requireAdmin } = require('../utils/authMiddleware');

//  Import all needed permit controller functions
const {
  requestPermit,
  getMyPermits,
  getAllPermits,
  approvePermit,
  rejectPermit
} = require('../controllers/permitController');

// Route for employee to request permit
router.post('/', authenticateToken, requestPermit);

// Route for logged-in user to view their permits
router.get('/me', authenticateToken, getMyPermits);

// Route for admin to view permits (authenticated + admin-only)
router.get('/', authenticateToken, requireAdmin, getAllPermits);

// Route for admin dashboard (frontend fetch without auth middleware)
router.get('/all', getAllPermits);

// Admin approves or rejects permits
router.patch('/approve/:permitId', approvePermit);
router.patch('/reject/:permitId', rejectPermit);

module.exports = router;

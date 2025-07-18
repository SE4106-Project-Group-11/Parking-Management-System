// backend/routes/payment.js

const express = require('express');
const router = express.Router();

const { authenticateToken, requireAdmin } = require('../utils/authMiddleware');

// Import controller functions
const {
  createPayment,
  getMyPayments,
  getAllPayments,
  processStripePayment,
  getPaymentById
} = require('../controllers/paymentController');

// ---------------------------------------------
// POST /api/payments
// Create a payment (any logged-in user)
router.post('/', authenticateToken, createPayment);

// POST /api/payments/process-stripe-payment
// Process Stripe payment
router.post('/process-stripe-payment', authenticateToken, processStripePayment);

// GET /api/payments/me
// Get payments for the logged-in user
router.get('/me', authenticateToken, getMyPayments);

// GET /api/payments
// Admin: Get all payments
router.get('/', authenticateToken, requireAdmin, getAllPayments);

// GET /api/payments/:id
// Get payment by ID — must be last to avoid route conflicts
router.get('/:id', authenticateToken, getPaymentById);

module.exports = router;

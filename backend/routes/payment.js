// backend/routes/payment.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../utils/authMiddleware');
// Import only Stripe-related controller functions (and general ones)
const { createPayment, getMyPayments, getAllPayments, processStripePayment } = require('../controllers/paymentController'); // <<< CORRECTED IMPORTS

// POST /api/payments        → any logged in user (for direct payment recording)
router.post('/', authenticateToken, createPayment);

// POST /api/payments/process-stripe-payment → Handle Stripe payment gateway charges
router.post('/process-stripe-payment', authenticateToken, processStripePayment); // <<< THIS IS THE CORRECT ROUTE

// REMOVED Payhere-specific routes:
// router.post('/initiate-payhere-payment', authenticateToken, initiatePayherePayment);
// router.post('/payhere-notify', handlePayhereIPN);

// GET  /api/payments/me      → that user’s payments
router.get('/me', authenticateToken, getMyPayments);

// GET  /api/payments         → admin only
router.get('/', authenticateToken, requireAdmin, getAllPayments);

module.exports = router;
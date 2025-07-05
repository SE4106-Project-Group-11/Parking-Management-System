const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { createPayment, getMyPayments, getAllPayments } = require('../controllers/paymentController');

// POST /api/payments         → any logged in user
router.post('/', auth(), createPayment);

// GET  /api/payments/me      → that user’s payments
router.get('/me', auth(), getMyPayments);

// GET  /api/payments         → admin only
router.get('/', auth('admin'), getAllPayments);

module.exports = router;
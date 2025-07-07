// backend/routes/payment.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../utils/authMiddleware'); // CORRECTED PATH
const { createPayment, getMyPayments, getAllPayments } = require('../controllers/paymentController');

router.post('/', authenticateToken, createPayment);

router.get('/me', authenticateToken, getMyPayments);

router.get('/', authenticateToken, requireAdmin, getAllPayments);

module.exports = router;
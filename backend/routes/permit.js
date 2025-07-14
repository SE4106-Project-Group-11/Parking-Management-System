// backend/routes/permit.js
const express = require('express');
const router = express.Router();

const { authenticateToken, requireAdmin } = require('../utils/authMiddleware'); // CORRECTED PATH
const { requestPermit, getMyPermits, getAllPermits } = require('../controllers/permitController');

router.post('/', authenticateToken, requestPermit);

router.get('/me', authenticateToken, getMyPermits);

router.get('/', authenticateToken, requireAdmin, getAllPermits);

module.exports = router;
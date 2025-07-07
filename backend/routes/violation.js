// backend/routes/violation.js
const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../utils/authMiddleware'); // CORRECTED PATH
const violationController = require("../controllers/violationController");

router.post('/', authenticateToken, requireAdmin, violationController.createViolation);

router.get('/all', authenticateToken, requireAdmin, violationController.getAllViolations);

router.get('/user/:userId', authenticateToken, requireOwnershipOrAdmin, violationController.getViolationsByUser);

router.get('/:id', authenticateToken, violationController.getViolationById);

router.delete('/:id', authenticateToken, requireAdmin, violationController.deleteViolation);

router.post('/:id/pay', authenticateToken, violationController.payViolation);

router.post('/:id/dispute', authenticateToken, violationController.disputeViolation);

module.exports = router;
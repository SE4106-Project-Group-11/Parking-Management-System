// backend/routes/violation.js
const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../utils/authMiddleware'); // CORRECTED PATH
const violationController = require("../controllers/violationController");

// Create violation
router.post('/', violationController.createViolation);

// Get all violations
router.get('/all', violationController.getAllViolations);

// Get violations by user
router.get('/user/:userId', violationController.getViolationsByUser);

// Delete violation
router.delete('/:id', violationController.deleteViolation);


/*
router.post('/', authenticateToken, requireAdmin, violationController.createViolation);

router.get('/all', authenticateToken, requireAdmin, violationController.getAllViolations);

router.get('/user/:userId', authenticateToken, requireOwnershipOrAdmin, violationController.getViolationsByUser);

router.get('/:id', authenticateToken, violationController.getViolationById);

router.delete('/:id', authenticateToken, requireAdmin, violationController.deleteViolation);

router.post('/:id/pay', authenticateToken, violationController.payViolation);

router.post('/:id/dispute', authenticateToken, violationController.disputeViolation);

*/
module.exports = router;
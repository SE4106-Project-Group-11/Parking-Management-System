const express = require("express");
const router = express.Router();
const violationController = require("../controllers/violationController");

// Create violation
router.post('/', violationController.createViolation);

// Get all violations
router.get('/all', violationController.getAllViolations);

// Get violations by user
router.get('/user/:userId', violationController.getViolationsByUser);

module.exports = router;
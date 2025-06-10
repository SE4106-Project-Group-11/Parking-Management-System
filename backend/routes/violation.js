// backend/routes/violation.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const vc      = require('../controllers/violationController');

router.post('/', auth('admin'), vc.createViolation);
router.get('/me', auth(),      vc.getMyViolations);

module.exports = router;

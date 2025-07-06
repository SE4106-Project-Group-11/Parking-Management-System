const express = require('express');
const router = express.Router();
const { requestPermit, getPermits } = require('../controllers/permitController');
const permitController = require('../controllers/permitController');

router.post('/', requestPermit);
router.get('/user/:userId', permitController.getPermitByUserId);
router.get('/', getPermits);

module.exports = router;
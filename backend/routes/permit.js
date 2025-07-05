const express = require('express');
const router = express.Router();
const { requestPermit, getPermits } = require('../controllers/permitController');

router.post('/', requestPermit);
router.get('/', getPermits);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser } = require('../controllers/adminController');

router.get('/pending', getPendingUsers);
router.patch('/approve/:type/:id', approveUser);

module.exports = router;
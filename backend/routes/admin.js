const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser } = require('../controllers/adminController');
const Employee = require('../models/Employee');

router.get('/pending', getPendingUsers);
router.patch('/approve/:type/:id', approveUser);

// Endpoint to get employee count
router.get('/employeeCount', async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee count' });
  }
});

module.exports = router;
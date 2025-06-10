// backend/controllers/violationController.js
const Violation = require('../models/Violation');

exports.createViolation = async (req, res) => {
  console.log('createViolation payload:', req.body);
  try {
    const { userId, userType, vehicleNo, violationType, fineAmount } = req.body;
    if (![userId, userType, vehicleNo, violationType, fineAmount].every(Boolean)) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const violation = await Violation.create({ userId, userType, vehicleNo, violationType, fineAmount });
    console.log('Saved violation:', violation);
    res.status(201).json({ message: 'Violation created', violation });
  } catch (err) {
    console.error('Error in createViolation:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyViolations = async (req, res) => {
  try {
    const violations = await Violation.find({ userId: req.user.id }).sort('-date');
    res.json({ violations });
  } catch (err) {
    console.error('Error in getMyViolations:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// (other methods omitted for brevity)

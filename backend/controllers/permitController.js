const Permit = require('../models/Permit');

exports.requestPermit = async (req, res) => {
  try {
    const permit = await Permit.create(req.body);
    res.status(201).json(permit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPermits = async (req, res) => {
  try {
    const permits = await Permit.find().populate('userId');
    res.json(permits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
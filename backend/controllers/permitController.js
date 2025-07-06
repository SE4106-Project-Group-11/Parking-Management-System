const Permit = require('../models/Permit');

exports.requestPermit = async (req, res) => {
  try {
    const permit = await Permit.create(req.body);
    res.status(201).json(permit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPermitByUserId = async (req, res) => {
  try {
    const permit = await Permit.findOne({ userId: req.params.userId, status: 'active' });
    if (!permit) return res.status(404).json({ message: 'No permit found' });

    res.json({ permit });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
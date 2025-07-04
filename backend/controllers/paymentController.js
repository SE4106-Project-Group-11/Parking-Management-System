// backend/controllers/paymentController.js
const Payment = require('../models/Payment');

exports.createPayment = async (req, res) => {
  try {
    const { amount, mode, paymentType } = req.body;
    if (!amount || !mode) {
      return res.status(400).json({ message: 'amount and mode are required' });
    }

    const payment = await Payment.create({
      userId:     req.user.id,
      userType:   req.user.role,
      paymentType,
      amount,
      mode,
      date:       new Date()
    });

    res.status(201).json({ message: 'Payment recorded', payment });
  } catch (err) {
    console.error('createPayment:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment
      .find({ userId: req.user.id })
      .sort('-date');
    res.json({ payments });
  } catch (err) {
    console.error('getMyPayments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment
      .find()
      .sort('-date');
    res.json({ payments });
  } catch (err) {
    console.error('getAllPayments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

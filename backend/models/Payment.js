const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  userType:  { type: String, required: true, enum: ['employee','nonemployee','visitor'] },
  paymentType: { type: String, enum: ['permit','violation'], default: 'permit' },
  amount:    { type: Number, required: true },
  mode:      { type: String, enum: ['card','paypal','cash','other'], required: true },
  date:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
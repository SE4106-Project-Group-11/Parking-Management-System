// backend/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, required: true },
  userType:    { type: String, required: true, enum: ['employee','nonemployee','visitor'] },
  paymentType: { type: String, enum: ['permit','violation'], default: 'permit' },
  amount:      { type: Number, required: true },
  mode:        { type: String, enum: ['card','paypal','cash','other', 'payhere'], required: true }, // <<< 'payhere' ADDED HERE
  date:        { type: Date, default: Date.now },
  transactionId: { type: String, unique: true, sparse: true }, // Added for gateway transaction IDs
  gatewayResponse: { type: Object } // Added to store full gateway response
});

module.exports = mongoose.model('Payment', paymentSchema);
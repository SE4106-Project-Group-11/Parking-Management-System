const mongoose = require('mongoose');

const permitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userType: { type: String, enum: ['employee', 'visitor', 'nonemployee'], required: true },
  vehicleNo: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'revoked'], default: 'active' }
});

module.exports = mongoose.model('Permit', permitSchema);

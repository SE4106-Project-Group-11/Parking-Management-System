// backend/models/Permit.js
const mongoose = require('mongoose');

const permitSchema = new mongoose.Schema({
  permitId: { type: String, required: true, unique: true },
  userType: { type: String, required: true, enum: ['employee', 'nonemployee', 'visitor'] },
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType', required: true },
  duration: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  vehicleType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending' },
}, {
  timestamps: true
});

module.exports = mongoose.model('Permit', permitSchema);
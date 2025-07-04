const mongoose = require('mongoose');

const permitSchema = new mongoose.Schema({
  userType: { type: String, required: true, enum: ['employee', 'nonemployee', 'visitor'] },
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

module.exports = mongoose.model('Permit', permitSchema);
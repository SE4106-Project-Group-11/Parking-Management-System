// backend/models/Violation.js
const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, required: true },
  userType:     { type: String, required: true, enum: ['employee','nonemployee','visitor'] },
  vehicleNo:    { type: String, required: true },
  date:         { type: Date,   default: Date.now },
  violationType:{ type: String, required: true },
  fineAmount:   { type: Number, required: true },
  status:       { type: String, enum: ['new','resolved'], default: 'new' },
}, { timestamps: true });

module.exports = mongoose.model('Violation', violationSchema);

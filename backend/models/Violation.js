// backend/models/Violation.js
const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema({
  violationId: { type: String, required: true, unique: true },
  vehicleNo: { type: String, required: true },
  date: { type: Date, required: true},
  violationType: { type: String, required: true},
  fineAmount: { type: Number, required: true},
  message: { type: String},
  userType: { type: String, enum: ["employee", "nonemployee", "visitor"], required: true},
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType', required: true },
  status: { type: String, enum: ['pending', 'paid', 'disputed', 'resolved'], default: 'pending' }
}, {
  timestamps: true
});

module.exports = mongoose.model("Violation", violationSchema);
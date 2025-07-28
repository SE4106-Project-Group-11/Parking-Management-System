const mongoose = require('mongoose');

const nonEmployeeSchema = new mongoose.Schema({
  nonEmployeeID: { type: String, unique: true }, 
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nic: { type: String, required: true, unique: true },
  telNo: { type: String, required: true },
  address: { type: String },
  vehicleNo: { type: String },
  permitType: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'nonemployee' },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  permits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permit' }]
}, {
  timestamps: true 
});

module.exports = mongoose.model('NonEmployee', nonEmployeeSchema);
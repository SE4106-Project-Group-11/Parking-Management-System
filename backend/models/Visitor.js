const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nic: { type: String, required: true , unique: true},
  telNo: { type: String, required: true },
  address: { type: String },
  vehicleNo: { type: String },
  permitType:{type:String}, // This might not be needed if permit details are managed solely via the Permit model
  password: { type: String, required: true },
  role: { type: String, default: 'visitor' },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  permits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permit' }]
});

module.exports = mongoose.model('Visitor', visitorSchema);
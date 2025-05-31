const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nic: { type: String, required: true ,unique: true},
  telNo: { type: String, required: true },
  address: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'visitor' },
  // add visitor-specific fields if needed
});

module.exports = mongoose.model('Visitor', visitorSchema);

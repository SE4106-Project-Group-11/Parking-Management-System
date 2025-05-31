const mongoose = require('mongoose');

const nonEmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nic: { type: String, required: true ,unique: true},
  telNo: { type: String, required: true },
  address: { type: String },
  vehicleNumber: { type: String },
 
  password: { type: String, required: true },
  role: { type: String, default: 'nonemployee' }
});

module.exports = mongoose.model('NonEmployee', nonEmployeeSchema);

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  empID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nic: { type: String, required: true ,unique: true},
  telNo: { type: String },
  address: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'employee' } // for future admin/user separation
});

module.exports = mongoose.model('Employee', employeeSchema);

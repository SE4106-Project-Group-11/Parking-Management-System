const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  empID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nic: { type: String, required: true ,unique: true},
  telNo: { type: String,required: true},
  vehicleNo: { type: String,required: true },
  permitType:{type:String,required: true},
  address: { type: String,required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'employee' } ,
  status: {
  type: String,
  enum: ['pending', 'approved'],
  default: 'pending'
}

});

module.exports = mongoose.model('Employee', employeeSchema);

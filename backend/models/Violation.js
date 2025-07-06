const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema({
  violationId: {type: String, required: true,unique: true },
  vehicleNo: {type: String,required: true },
  date: {type: Date,required: true},
  violationType: {type: String,required: true},
  fineAmount: {type: Number,required: true},
  message: {type: String},
  userType: {type: String,enum: ["employee", "nonemployee", "visitor"], required: true},
  userId: {type: String, // use String not ObjectId for EMP111, etc.required: true
}
});

module.exports = mongoose.model("Violation", violationSchema);
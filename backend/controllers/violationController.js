const Violation = require('../models/Violation');

async function generateViolationId() {
  const last = await Violation.findOne().sort({ _id: -1 });
  let lastId = last?.violationId || "VIO000";
  let num = parseInt(lastId.replace("VIO", ""));
  let next = "VIO" + String(num + 1).padStart(3, "0");
  return next;
} 

exports.createViolation = async (req, res) => {
  try {
    const {
      vehicleNo,date,
      violationType,fineAmount,message,
      userType,userId
    } = req.body;

    const violationId = await generateViolationId(); // generate unique ID

    const newViolation = new Violation({
      violationId,vehicleNo,
      date, violationType,
      fineAmount,message,
      userType,userId
    });

    const saved = await newViolation.save();

    return res.status(201).json({ success: true, violation: saved });
  } catch (err) {
    console.error("Error saving violation:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllViolations = async (req, res) => {
  try {
    const all = await Violation.find().sort({ date: -1 });
    res.status(200).json({ success: true, violations: all });
  } catch (err) {
    console.error("Error fetching all violations:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getViolationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.query;  
    const filter = { userId };
    if (userType) filter.userType = userType;

    const list = await Violation.find( filter ).sort({ date: -1 });
    res.status(200).json({ success: true, violations: list });
  } catch (err) {
    console.error("Error fetching user violations:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteViolation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedViolation = await Violation.findByIdAndDelete(id);
    
    if (!deletedViolation) {
      return res.status(404).json({ success: false, error: 'Violation not found' });
    }
    
    return res.status(200).json({ success: true, message: 'Violation deleted successfully' });
  } catch (err) {
    console.error("Error deleting violation:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateViolationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const vio = await Violation.findByIdAndUpdate(id, { status }, { new: true });
  res.json({ success: true, violation: vio });
};

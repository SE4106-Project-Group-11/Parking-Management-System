// backend/controllers/violationController.js
const Violation = require('../models/Violation');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');
const Payment = require('../models/Payment');

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
/*
exports.getViolationById = async (req, res) => {
    try {
        const violationId = req.params.id;
        const violation = await Violation.findById(violationId);
        if (!violation) {
            return res.status(404).json({ success: false, message: 'Violation not found' });
        }
        res.json({ success: true, violation });
    } catch (error) {
        console.error('getViolationById error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching violation details.' });
    }
};
*/

/*
exports.payViolation = async (req, res) => {
    try {
        const violationId = req.params.id;
        const { mode } = req.body;

        const violation = await Violation.findById(violationId);

        if (!violation) {
            return res.status(404).json({ success: false, message: 'Violation not found.' });
        }

        if (String(violation.userId) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to pay this violation.' });
        }

        if (violation.status === 'paid' || violation.status === 'resolved') {
            return res.status(400).json({ success: false, message: 'Violation already paid or resolved.' });
        }

        violation.status = 'paid';
        await violation.save();

        await Payment.create({
            userId: req.user.id,
            userType: req.user.role,
            paymentType: 'violation',
            amount: violation.fineAmount,
            mode: mode,
            date: new Date()
        });

        res.status(200).json({ success: true, message: 'Violation marked as paid!', violation });
    } catch (error) {
        console.error('payViolation error:', error);
        res.status(500).json({ success: false, message: 'Server error during payment processing.' });
    }
};
*/
/*
exports.disputeViolation = async (req, res) => {
    try {
        const violationId = req.params.id;
        const { reason, explanation } = req.body;

        const violation = await Violation.findById(violationId);

        if (!violation) {
            return res.status(404).json({ success: false, message: 'Violation not found.' });
        }

        if (String(violation.userId) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to dispute this violation.' });
        }

        if (violation.status === 'paid' || violation.status === 'disputed' || violation.status === 'resolved') {
            return res.status(400).json({ success: false, message: 'Violation cannot be disputed in its current status.' });
        }

        violation.status = 'disputed';
        // You might want to add fields for disputeReason and disputeExplanation to the Violation model
        // violation.disputeReason = reason;
        // violation.disputeExplanation = explanation;
        await violation.save();

        res.status(200).json({ success: true, message: 'Violation disputed successfully!', violation });
    } catch (error) {
        console.error('disputeViolation error:', error);
        res.status(500).json({ success: false, message: 'Server error during dispute submission.' });
    }
};
*/

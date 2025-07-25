// backend/controllers/violationController.js
const Violation = require('../models/Violation');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');
const Payment = require('../models/Payment');

// Helper function to find the real database _id from a custom ID like 'EMP1'
async function findRealUserId(userType, customUserId) {
    let user;
    if (userType === 'employee') {
        // We assume the custom ID is stored in the 'empID' field in your Employee model
        user = await Employee.findOne({ empID: customUserId });
    } else if (userType === 'nonemployee') {
        // Assuming custom ID for non-employees is their NIC or another unique field
        user = await NonEmployee.findOne({ nic: customUserId }); 
    } else if (userType === 'visitor') {
        // Assuming custom ID for visitors is their NIC or another unique field
        user = await Visitor.findOne({ nic: customUserId });
    }
    // Return the database _id if found, otherwise return the original ID
    return user ? user._id.toString() : customUserId;
}

async function generateViolationId() {
  const last = await Violation.findOne().sort({ _id: -1 });
  let lastId = last?.violationId || "VIO000";
  let num = parseInt(lastId.replace("VIO", ""));
  let next = "VIO" + String(num + 1).padStart(3, "0");
  return next;
} 

// *** MODIFIED createViolation FUNCTION ***
exports.createViolation = async (req, res) => {
  try {
    const { vehicleNo, date, violationType, fineAmount, message, userType, userId } = req.body;

    // This is the new smart logic:
    // It takes the userId from the form (e.g., "EMP1") and finds the real database _id.
    const realUserId = await findRealUserId(userType, userId);

    const violationId = await generateViolationId();

    const newViolation = new Violation({
      violationId, vehicleNo, date, violationType, fineAmount, message, userType,
      userId: realUserId // We save the CORRECT database _id here
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
  const { userId } = req.params; // This userId from the URL is the database _id
  const { userType } = req.query;

  if (!userId || !userType) {
    return res.status(400).json({ success: false, message: 'Missing userId or userType' });
  }

  try {
    // This query now works because the correct database _id was saved.
    const violations = await Violation.find({ userId: userId, userType: userType }).sort({ date: -1 });
    res.status(200).json({ success: true, violations });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

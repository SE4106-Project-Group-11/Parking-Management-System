// backend/controllers/violationController.js
const Violation = require('../models/Violation');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');
const Payment = require('../models/Payment');

exports.createViolation = async (req, res) => {
  try {
    const { violationId, vehicleNo, date, violationType, fineAmount, message, userType, userId } = req.body;


    if (!violationId || !vehicleNo || !date || !violationType || !fineAmount || !userType || !userId) {
        return res.status(400).json({ success: false, message: 'Missing required violation fields.' });
    }


    const violation = await Violation.create({
      violationId, vehicleNo, date, violationType, fineAmount, message, userType, userId

    });

    let UserModel;
    if (userType === 'employee') UserModel = Employee;
    else if (userType === 'visitor') UserModel = Visitor;
    else if (userType === 'nonemployee') UserModel = NonEmployee;

    if (UserModel) {
        const user = await UserModel.findById(userId);
        if (user) {
            user.violations.push(violation._id);
            await user.save();
        } else {
            console.warn(`User ${userId} of type ${userType} not found when linking violation ${violation._id}`);
        }
    }

    res.status(201).json({ success: true, message: 'Violation created successfully!', violation });
  } catch (err) {
    console.error('createViolation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllViolations = async (req, res) => {
  try {
    const violations = await Violation.find().sort('-date').populate({
        path: 'userId',
        select: 'name email empID'
    });
    res.json({ success: true, violations });
  } catch (err) {
    console.error('getAllViolations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getViolationsByUser = async (req, res) => {
  try {

    const targetUserId = req.params.userId;
    const violations = await Violation.find({ userId: targetUserId }).sort('-date');
    res.json({ success: true, violations });

  } catch (err) {
    console.error('getViolationsByUser error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

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

exports.deleteViolation = async (req, res) => {
  try {
    const violation = await Violation.findByIdAndDelete(req.params.id);
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }
    res.json({ success: true, message: 'Violation deleted successfully!' });
  } catch (err) {
    console.error('deleteViolation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


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


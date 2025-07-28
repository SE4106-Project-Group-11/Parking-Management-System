// backend/controllers/permitController.js
const Permit = require('../models/Permit');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');

exports.requestPermit = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    const { permitId, duration, vehicleNo, vehicleType, startDate, endDate, notes, permitType } = req.body;

    const permit = await Permit.create({
      permitId,
      userType,
      userId,
      duration,
      vehicleNo,
      vehicleType,
      startDate,
      endDate,
      notes,
      permitType
    });

    let UserModel;
    if (userType === 'employee') UserModel = Employee;
    else if (userType === 'visitor') UserModel = Visitor;
    else if (userType === 'nonemployee') UserModel = NonEmployee;

    if (UserModel) {
        const user = await UserModel.findById(userId);
        if (user) {
            user.permits.push(permit._id);
            await user.save();
        } else {
            console.warn(`User ${userId} of type ${userType} not found when linking permit ${permit._id}`);
        }
    }

    res.status(201).json({ success: true, message: 'Permit request submitted successfully!', permit });
  } catch (err) {
    console.error('requestPermit error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getMyPermits = async (req, res) => {
  try {
    const userId = req.user.id;
    const userPermits = await Permit.find({ userId: userId }).sort('-createdAt');
    res.json({ success: true, permits: userPermits });
  } catch (err) {
    console.error('getMyPermits error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all permits (for Admin)
exports.getAllPermits = async (req, res) => {
    try {
        const permits = await Permit.find();
        res.status(200).json(permits);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch permits.' });
    }
};

// Approve permit
exports.approvePermit = async (req, res) => {
    const { permitId } = req.params;
    try {
        await Permit.findByIdAndUpdate(permitId, { status: 'Approved' });
        res.json({ message: 'Permit approved successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error approving permit.' });
    }
};

// Reject permit
exports.rejectPermit = async (req, res) => {
    const { permitId } = req.params;
    try {
        await Permit.findByIdAndUpdate(permitId, { status: 'Rejected' });
        res.json({ message: 'Permit rejected successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error rejecting permit.' });
    }
};
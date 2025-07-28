const mongoose = require('mongoose');
const Violation = require('../models/Violation');
const Employee = require('../models/Employee'); // CORRECTED: Using the Employee model
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');
const Payment = require('../models/Payment');

// Helper function to find the real database _id from a custom ID like 'EMP1'
async function findRealUserId(userType, customUserId) {
    // If the ID from the form is already a valid MongoDB ID, we can just use it.
    if (mongoose.Types.ObjectId.isValid(customUserId)) {
        return customUserId;
    }

    let user;
    // Use a case-insensitive regex for the search to prevent case-mismatch errors.
    const searchIdRegex = new RegExp(`^${customUserId}$`, 'i');

    if (userType === 'employee') {
        // *** FIX: Use the correct 'Employee' model and 'empID' field ***
        user = await Employee.findOne({ empID: { $regex: searchIdRegex } });
    } else if (userType === 'nonemployee') {
        // Assuming 'nic' is the unique field for non-employees
        user = await NonEmployee.findOne({ nic: { $regex: searchIdRegex } }); 
    } else if (userType === 'visitor') {
        // Assuming 'nic' is the unique field for visitors
        user = await Visitor.findOne({ nic: { $regex: searchIdRegex } });
    }
    
    // If we found a user, return their permanent MongoDB _id.
    if (user) {
        return user._id.toString();
    } else {
        // If no user is found, the ID from the form is invalid.
        throw new Error(`User with ID '${customUserId}' of type '${userType}' not found.`);
    }
}

// Generates the next violation ID, e.g., VIO006
async function generateViolationId() {
    const last = await Violation.findOne().sort({ _id: -1 });
    let lastId = last?.violationId || "VIO000";
    let num = parseInt(lastId.replace("VIO", ""));
    let next = "VIO" + String(num + 1).padStart(3, "0");
    return next;
} 

// *** 1. CORRECTED createViolation FUNCTION ***
// This now correctly finds the user by 'EMP1' and saves their permanent _id.
exports.createViolation = async (req, res) => {
    try {
        const { vehicleNo, date, violationType, fineAmount, message, userType, userId } = req.body;

        // This takes the userId from the form (e.g., "EMP1") and finds the real database _id.
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
        // Handle the case where the user ID was not found
        if (err.message.includes('not found')) {
            return res.status(404).json({ success: false, error: err.message });
        }
        return res.status(500).json({ success: false, error: err.message });
    }
};

// *** 2. CORRECTED getAllViolations FUNCTION ***
// This now fetches the friendly ID (e.g., 'EMP1') and handles old data.
exports.getAllViolations = async (req, res) => {
    try {
        // Get all violations from the database
        const allViolations = await Violation.find().sort({ date: -1 }).lean();

        // Now, "populate" them with the friendly user IDs
        const populatedViolations = await Promise.all(allViolations.map(async (violation) => {
            let userProfile;
            let friendlyId = violation.userId; // Default to the stored ID

            try {
                // Skip if userId is missing
                if (!violation.userId) {
                    return violation;
                }

                const isMongoId = mongoose.Types.ObjectId.isValid(violation.userId);

                if (isMongoId) {
                    if (violation.userType === 'employee') {
                        // *** FIX: Use the correct 'Employee' model and 'empID' field ***
                        userProfile = await Employee.findById(violation.userId).select('empID');
                        if (userProfile) friendlyId = userProfile.empID;

                    } else if (violation.userType === 'nonemployee') {
                        userProfile = await NonEmployee.findById(violation.userId).select('nic');
                        if (userProfile) friendlyId = userProfile.nic;

                    } else if (violation.userType === 'visitor') {
                        userProfile = await Visitor.findById(violation.userId).select('nic');
                        if (userProfile) friendlyId = userProfile.nic;
                    }
                }
                
            } catch (e) {
                console.error(`Could not process user for violation ${violation.violationId}`, e);
            }

            // Return a new object with the userId replaced by the friendly one
            return {
                ...violation,
                userId: friendlyId 
            };
        }));

        res.status(200).json({ success: true, violations: populatedViolations });

    } catch (err) {
        console.error("Error fetching all violations:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.getViolationsByUser = async (req, res) => {
    const { userId } = req.params; 
    const { userType } = req.query;

    if (!userId || !userType) {
        return res.status(400).json({ success: false, message: 'Missing userId or userType' });
    }

    try {
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

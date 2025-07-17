// backend/controllers/adminController.js
const Employee = require('../models/Employee');
const NonEmployee = require('../models/NonEmployee');
const Visitor = require('../models/Visitor');
const Permit = require('../models/Permit'); // Make sure Permit model is correctly defined
const transporter = require('../utils/email'); // Nodemailer transporter

// Get pending users
exports.getPendingUsers = async (req, res) => {
  try {
    const pending = {
      employees: await Employee.find({ status: 'pending' }),
      nonemployees: await NonEmployee.find({ status: 'pending' }),
      visitors: await Visitor.find({ status: 'pending' }),
    };
    res.json(pending);
  } catch (err) {
    console.error('getPendingUsers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Approve a user and send email notification
exports.approveUser = async (req, res) => {
  try {
    const { type, id } = req.params;
    const models = { employee: Employee, nonemployee: NonEmployee, visitor: Visitor };
    const model = models[type];
    if (!model) return res.status(400).json({ success: false, message: 'Invalid user type' }); // Added success: false

    // Update status and fetch the updated user document
    const user = await model.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' }); // Added success: false

    // If employee, create a 1-year permit automatically
    if (type === 'employee') {
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(today.getFullYear() + 1);

      const permitId = 'PER' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');

      // --- CRITICAL FIX: Provide fallbacks for potentially missing user fields ---
      const permit = new Permit({
        permitId: permitId,
        userId: user._id,
        userType: 'employee',
        duration: '1-year', // Default duration for employee permits
        vehicleNo: user.vehicleNo || 'N/A_VNO', // Fallback if vehicleNo is missing from user
        vehicleType: user.vehicleType || 'N/A_VTYPE', // Fallback if vehicleType is missing from user
        permitType: user.permitType || 'annual', // Fallback if permitType is missing from user
        startDate: today,
        endDate: nextYear,
        status: 'approved', // Permit is approved when user is approved
        notes: `Auto-issued upon employee registration approval on ${today.toLocaleDateString()}`
      });
      await permit.save(); // This is the line that might throw a validation error

      // Link permit to the employee's permits array
      user.permits.push(permit._id);
      await user.save(); // Save the updated employee with the new permit reference
    }

    // Send approval email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Your Parking Management System Registration Has Been Approved',
      text: `Hello ${user.name},\n\nYour account for the Parking Management System has been approved by the admin.
             You can now log in using your email as the USERNAME: ${user.email}.
             ${type === 'employee' ? `\n\nYour annual parking permit has been issued for vehicle: ${user.vehicleNo || 'N/A_VNO'}.` : ''}
             \n\nThank you.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('Email error:', error);
      else console.log('Approval email sent:', info.response);
    });

    res.json({ success: true, user, message: 'User approved, permit issued (if employee), and email sent.' });
  } catch (err) {
    console.error('approveUser error:', err); // Log the specific error to your terminal
    // IMPORTANT: Send the specific error message from the backend to the frontend for better debugging
    res.status(500).json({ success: false, message: err.message || 'An unexpected error occurred during approval.' });
  }
};
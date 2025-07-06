const Employee = require('../models/Employee');
const NonEmployee = require('../models/NonEmployee');
const Visitor = require('../models/Visitor');
const Permit = require('../models/Permit');
const transporter = require('../utils/email');

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
    res.status(500).json({ message: err.message });
  }
};

// Approve a user and send email notification
exports.approveUser = async (req, res) => {
  try {
    const { type, id } = req.params; // employee | nonemployee | visitor
    const models = { employee: Employee, nonemployee: NonEmployee, visitor: Visitor };
    const model = models[type];
    if (!model) return res.status(400).json({ message: 'Invalid user type' });

    // update status
    const user = await model.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    //  If employee, create 1-year permit
    if (type === 'employee') {
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(today.getFullYear() + 1);

      const permit = new Permit({
        userId: user._id,
        userType: 'employee',
        vehicleNo: user.vehicleNo,
        startDate: today,
        endDate: nextYear,
        status: 'active'
      });
      await permit.save();
    }
    // send approval email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Your registration has been approved',
      text: `Hello ${user.name},\n\nYour account has been approved by the admin. 
            You can now log in using your email as the USERNAME: ${user.email}.
            \n\nThank you.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('Email error:', error);
      else console.log('Approval email sent:', info.response);
    });

    res.json({ user, message: 'User approved, permit issued (if employee), and email sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
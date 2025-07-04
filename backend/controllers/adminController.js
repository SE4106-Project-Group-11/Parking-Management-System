const Employee = require('../models/Employee');
const NonEmployee = require('../models/NonEmployee');
const Visitor = require('../models/Visitor');
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

    // send approval email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Your registration has been approved',
      text: `Hello ${user.name},\n\nYour account has been approved by the admin. You can now log in with your email: ${user.email}.\n\nThank you.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('Email error:', error);
      else console.log('Approval email sent:', info.response);
    });

    res.json({ user, message: 'User approved and notified via email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
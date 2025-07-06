
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = process.env;
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');


exports.register = async (req, res) => {
  try {
    const { userType, empID, name, email, nic, telNo, address, vehicleNo, password, permitType } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    let model;
    if (userType === 'employee') model = Employee;
    else if (userType === 'nonemployee') model = NonEmployee;
    else if (userType === 'visitor') model = Visitor;
    else return res.status(400).json({ message: 'Invalid user type' });

    // Unique checks
    if (await model.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    if (userType === 'employee' && await model.findOne({ empID })) return res.status(400).json({ message: 'Employee ID exists' });

    const user = await model.create({ empID, name, email, nic, telNo, address, vehicleNo, password: hashed, permitType });
    res.status(201).json({ message: 'Registered, pending approval', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    let Model;
    switch (userType) {
      case 'admin': Model = Admin; break;
      case 'employee': Model = Employee; break;
      case 'nonemployee': Model = NonEmployee; break;
      case 'visitor': Model = Visitor; break;
      default: return res.status(400).json({ message: 'Invalid user type' });
    }

    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (userType !== 'admin' && user.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: userType },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: userType
    };

    //  Include empID if employee
    if (userType === 'employee' && user.empID) {
      userResponse.empID = user.empID;
    }

    res.json({
      token,
      user: userResponse
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



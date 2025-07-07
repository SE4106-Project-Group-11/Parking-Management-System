// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = process.env;
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');


/*
exports.register = async (req, res) => {
  try {
    const { userType, empID,  name, email, nic, telNo, address, vehicleNo, password,permitType,vehicleType } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
   
    if (userType === 'employee') {
      if (await Employee.findOne({ email }) || await Employee.findOne({ empID })) {
        return res.status(400).json({ message: 'Employee email or ID already exists' });
      }
      const employee = new Employee({
        empID,
        name,
        email,
        nic,
        vehicleNo,
        vehicleType,
        permitType,        
        telNo,
        address,
        password: hashedPassword
      });
      await employee.save();
      return res.status(201).json({ message: 'Employee registered successfully' });
    }

    if (userType === 'visitor') {
      if (await Visitor.findOne({ email })) {
        return res.status(400).json({ message: 'Visitor email already exists' });
      }
      const visitor = new Visitor({
        name,
        email,
        nic,
        vehicleNo,
        vehicleType,
        permitType,        
        telNo,
        address,
        password: hashedPassword
      });
      await visitor.save();
      return res.status(201).json({ message: 'Visitor registered successfully' });
    }

    if (userType === 'nonemployee') {
      if (await NonEmployee.findOne({ email })) {
        return res.status(400).json({ message: 'Non-Employee email already exists' });
      }
      const nonEmployee = new NonEmployee({
       name,
        email,
        nic,
        vehicleNo,
        vehicleType,
        permitType,        
        telNo,
        address,
        password: hashedPassword
      });
      await nonEmployee.save();
      return res.status(201).json({ message: 'Non-Employee registered successfully' });
    }

    return res.status(400).json({ message: 'Invalid user type' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    let userModel;
    if (userType === 'admin') userModel = Admin;
    else if (userType === 'employee') userModel = Employee;
    else if (userType === 'visitor') userModel = Visitor;
    else if (userType === 'nonemployee') userModel = NonEmployee;
    else return res.status(400).json({ message: 'Invalid user type' });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: userType },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userType
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};

*/



exports.register = async (req, res) => {
  try {
    const { userType, empID, name, email, nic, telNo, address, vehicleNo, password, permitType } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    let model;

    if (userType === 'employee') model = Employee;
    else if (userType === 'nonemployee') model = NonEmployee;
    else if (userType === 'visitor') model = Visitor;
    else return res.status(400).json({ message: 'Invalid user type' });

    if (await model.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    if (userType === 'employee' && empID && await model.findOne({ empID })) return res.status(400).json({ message: 'Employee ID exists' });
    if (await model.findOne({ nic })) return res.status(400).json({ message: 'NIC already exists' });

    const user = await model.create({
      empID, name, email, nic, telNo, address,
      vehicleNo, vehicleType, permitType,
      password: hashed
    });

    res.status(201).json({ message: 'Registered, pending approval', userId: user._id });
  } catch (err) {
    console.error('Registration error:', err);
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
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let profileData = null;

    if (userRole === 'employee') {
      profileData = await Employee.findById(userId)
                                  .populate('permits')
                                  .populate('violations');
    } else if (userRole === 'admin') {
      profileData = await Admin.findById(userId);
    } else if (userRole === 'visitor') {
      profileData = await Visitor.findById(userId)
                                 .populate('permits');
    } else if (userRole === 'nonemployee') {
      profileData = await NonEmployee.findById(userId)
                                     .populate('permits');
    }

    if (!profileData) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const userProfile = {
      _id: profileData._id,
      role: profileData.role,
      name: profileData.name,
      email: profileData.email,
      ...(profileData.empID && { empID: profileData.empID }),
      ...(profileData.nic && { nic: profileData.nic }),
      ...(profileData.telNo && { telNo: profileData.telNo }),
      ...(profileData.address && { address: profileData.address }),
      ...(profileData.vehicleNo && { vehicleNo: profileData.vehicleNo }),
      ...(profileData.vehicleType && { vehicleType: profileData.vehicleType }),
      ...(profileData.permitType && { permitType: profileData.permitType }),
      permits: profileData.permits || [],
      violations: profileData.violations || [],
    };

    res.status(200).json({ user: userProfile });

  } catch (err) {
    console.error('getCurrentUser error:', err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};
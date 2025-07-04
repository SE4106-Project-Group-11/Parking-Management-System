const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      userType: user.userType,
      employeeId: user.employeeId 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Register Controller
const register = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, email, password, employeeId } = req.body;

    // Check if user already exists (using standard Mongoose methods)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if employee ID already exists
    const existingEmployeeId = await User.findOne({ employeeId: employeeId.trim() });
    if (existingEmployeeId) {
      return res.status(409).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user (using standard Mongoose create method)
    const userData = {
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      employeeId: employeeId.trim(),
      userType: 'employee' // Default to employee
    };

    console.log('👤 Creating user with data:', { ...userData, password: '[HIDDEN]' });

    const newUser = await User.create(userData);
    console.log('✅ User saved to database:', newUser._id);

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          employeeId: newUser.employeeId,
          userType: newUser.userType
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: error.message
    });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { email: req.body.email, userType: req.body.userType });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, userType } = req.body;

    // Find user by email (using standard Mongoose method)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check user type matches
    if (user.userType !== userType) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid user type.'
      });
    }

    // Generate token
    const token = generateToken(user);

    console.log('✅ Login successful for user:', user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          employeeId: user.employeeId,
          userType: user.userType
        },
        token,
        redirectTo: user.userType === 'admin' ? '/admin.html' : '/employee.html'
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          employeeId: user.employeeId,
          userType: user.userType
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
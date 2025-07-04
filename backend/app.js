const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// MongoDB Connection

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log('🔍 Connected to database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const adminExists = await User.findOne({ email: 'admin@parking.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password', 12);
      await User.create({
        fullName: 'Admin User',
        email: 'admin@parking.com',
        password: hashedPassword,
        employeeId: 'ADMIN001',
        userType: 'admin'
      });
      console.log('✅ Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'admin', 'admin.html'));
});

app.get('/employee.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'employee', 'employee.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'home', 'home.html'));
});

app.get('/nonEmployee.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'nonEmployee', 'nonEmployee.html'));
});

app.get('/visitors.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'visitors', 'visitors.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

module.exports = app;
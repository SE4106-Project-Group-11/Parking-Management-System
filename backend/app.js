const express = require('express');
const cors = require('cors');
const path = require('path');           // for serving frontend
require('dotenv').config();
const connectDB = require('./utils/db');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const permitRoutes = require('./routes/permit');
const adminRoutes = require('./routes/admin');

// Models for initial setup
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Log warning if SMTP not configured
if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
  console.warn('SMTP settings missing! Approval emails will fail.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/admin', adminRoutes);

// Route SPA entrypoints
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Create default admin if none exists
const initAdmin = async () => {
  if (!(await Admin.findOne({ email: 'admin@gmail.com' }))) {
    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ name: 'Default Admin', email: 'admin@gmail.com', password: hashed });
    console.log('Default admin created');
  }
};
initAdmin();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
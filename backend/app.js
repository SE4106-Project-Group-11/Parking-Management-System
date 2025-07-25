// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./utils/db');

// --- ROUTE IMPORTS ---
// <<< CRITICAL: Make sure the filename here matches your actual file name (authRoutes.js)
// const authRoutes = require('./routes/authRoutes'); // CORRECTED FROM './routes/auth'
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const permitRoutes = require('./routes/permit');
const adminRoutes = require('./routes/admin'); // Assuming this file exists and is named admin.js
const violationRoutes = require('./routes/violation');


// Models for initial setup (like creating default admin)
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Log warning if SMTP not configured
if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
  console.warn('SMTP settings missing! Approval emails will fail.');
}

// --- API ROUTES MOUNTING ---
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/violations', violationRoutes);

// --- FRONTEND SPA ENTRYPOINTS ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Home.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html')); // Assuming index.html is your login page
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});
app.get('/pages/:role/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, `../frontend/pages/${req.params.role}/dashboard.html`));
});
app.get('/pages/employee/violations.html', (req, res) => {
    res.sendFile(path.join(__dirname, `../frontend/pages/employee/violations.html`));
});
app.get('/pages/employee/qrcode.html', (req, res) => {
    res.sendFile(path.join(__dirname, `../frontend/pages/employee/qrcode.html`));
});
app.get('/pages/employee/payment-management.html', (req, res) => {
    res.sendFile(path.join(__dirname, `../frontend/pages/employee/payment-management.html`));
});


// Create default admin if none exists
const initAdmin = async () => {
  if (!(await Admin.findOne({ email: 'admin@gmail.com' }))) {
    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ name: 'Default Admin', email: 'admin@gmail.com', password: hashed, status: 'approved' });
    console.log('Default admin created');
  }
};
initAdmin();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
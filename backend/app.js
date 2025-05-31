const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// MongoDB connection and server start
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async() => {
    console.log('MongoDB connected');

    // Call default admin seeding function
    await seedDefaultAdmin();

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });



//  Default admin seeding function
async function seedDefaultAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log(' Default admin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new Admin({
      name: 'Default Admin',
      email: 'admin@gmail.com',
      password: hashedPassword
    });

    await admin.save();
    console.log('Default admin created: admin@gmail.com / admin123');
  } catch (err) {
    console.error(' Error creating default admin:', err.message);
  }
}



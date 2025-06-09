const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Employee ID must be at least 3 characters']
  },
  userType: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee'
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  collection: 'employees' // Explicitly set collection name
});

// Remove password from JSON output (for security)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Export with 'User' as model name but 'employees' as collection
module.exports = mongoose.model('User', userSchema);
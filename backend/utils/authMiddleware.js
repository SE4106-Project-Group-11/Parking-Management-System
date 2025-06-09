const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Employee or Admin middleware
const requireEmployee = (req, res, next) => {
  if (!['employee', 'admin'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: 'Employee access required'
    });
  }
  next();
};

// Check if user owns resource or is admin
const requireOwnershipOrAdmin = (req, res, next) => {
  const resourceUserId = parseInt(req.params.userId || req.params.id);
  const currentUserId = parseInt(req.user.id);
  const isAdmin = req.user.userType === 'admin';

  if (resourceUserId !== currentUserId && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmployee,
  requireOwnershipOrAdmin
};
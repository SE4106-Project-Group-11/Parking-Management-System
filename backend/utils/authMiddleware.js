// backend/utils/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // console.error('JWT verification error:', err); // Uncomment for debugging
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user; // 'user' here is the decoded JWT payload: { id: user._id, role: userType }
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') { // Corrected: Check req.user.role
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const requireEmployee = (req, res, next) => {
  if (!['employee', 'admin'].includes(req.user.role)) { // Corrected: Check req.user.role
    return res.status(403).json({ success: false, message: 'Employee access required' });
  }
  next();
};

const requireOwnershipOrAdmin = (req, res, next) => {
  const resourceIdFromParam = req.params.userId || req.params.id;
  const currentUserIdFromToken = req.user.id;

  const isAdmin = req.user.role === 'admin';

  if (String(resourceIdFromParam) !== String(currentUserIdFromToken) && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only access your own resources.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmployee,
  requireOwnershipOrAdmin
};
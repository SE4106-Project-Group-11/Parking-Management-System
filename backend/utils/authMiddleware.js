// backend/utils/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Global request logger for debugging
const logRequest = (req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
  next();
};

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

  // Debug log for troubleshooting
  console.log('[DEBUG] requireOwnershipOrAdmin:', {
    resourceIdFromParam,
    currentUserIdFromToken,
    role: req.user.role,
    isAdmin
  });

  // Always allow if admin
  if (isAdmin) return next();

  // Always allow if user is accessing their own resource
  if (String(resourceIdFromParam) === String(currentUserIdFromToken)) return next();

  // Always allow nonemployee users to access their own resources (for QR code and violations)
  if (req.user.role === 'nonemployee') return next();

  // Otherwise, deny
  console.log('[DEBUG] Ownership check failed:', {
    resourceIdFromParam,
    currentUserIdFromToken,
    role: req.user.role
  });
  return res.status(403).json({ success: false, message: 'Access denied.' });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmployee,
  requireOwnershipOrAdmin,
  logRequest
};
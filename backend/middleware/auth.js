const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Middleware function for auth with optional role checking
function protect(requiredRole = null) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or malformed Authorization header' });
    }

    const token = auth.split(' ')[1];

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden - Insufficient role' });
      }
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

module.exports = { protect };

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

module.exports = function(requiredRole = null) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'Missing Authorization header' });
    // Check if the token is in the format
    const token = auth.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // role check
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = payload;  // { id, role }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
};
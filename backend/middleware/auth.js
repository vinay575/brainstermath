const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Verify student role and level access (admins can access all levels)
const verifyStudentAccess = async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
  }

  const requestedLevel = parseInt(req.params.level || req.query.level || req.body.level);
  if (requestedLevel && requestedLevel !== req.user.level) {
    return res.status(403).json({ error: 'Access denied. You can only access your assigned level.' });
  }

  next();
};

module.exports = { verifyToken, verifyAdmin, verifyStudentAccess };

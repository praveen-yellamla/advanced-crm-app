const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Middleware to protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and attach to request
      let user;
      const { userId, role } = decoded;

      if (role === 'CLIENT') {
        user = await prisma.client.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, status: true }
        });
        if (user) {
          user.role = 'CLIENT';
          user.isActive = user.status === 'ACTIVE';
        }
      } else {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, role: true, isActive: true }
        });
      }

      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware to authorize specific roles
 * @param {Array} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

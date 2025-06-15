const jwt = require('jsonwebtoken');
const db = require("../models")
const User = db.users

const rbac = require('../config/rbac.config');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = user;

    const role = user.role;
    console.log("role:",role)
    const permissions = rbac[role]?.routes || [];
    console.log("permissions:",permissions)

    const requestPath = req.baseUrl.replace('/api', '');
    console.log("requestpath:",requestPath)
    const requestMethod = req.method;
    console.log("requestMethod:",requestMethod)

    const isAllowed = permissions.some(route => {
      return (
        requestPath.startsWith(route.path) &&
        route.methods.includes(requestMethod)
      );
    });

    if (!isAllowed) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  } catch (error) {
    console.error("JWT Auth Error:", error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
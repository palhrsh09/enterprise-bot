const jwt = require('jsonwebtoken');
const db = require("../models")
const User = db.users

const authenticate = async (req, res, next) => {
  console.log("Authorization header:", req);
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

    console.log("Authenticated user details:", user); // Move here after definition

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Auth Error:", error); // Use `console.error` for better visibility
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
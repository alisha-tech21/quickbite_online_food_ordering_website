const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Verifies the Bearer token and attaches the logged-in user to req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    if (req.user.status === 'suspended') {
      res.status(403);
      throw new Error('Account suspended. Contact support.');
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

// Usage: authorize('admin'), authorize('admin', 'branch_manager'), etc.
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user ? req.user.role : 'guest'}' is not permitted to perform this action`);
    }
    next();
  };
};

module.exports = { protect, authorize };

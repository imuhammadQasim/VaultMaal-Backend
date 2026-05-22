const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Protect routes and check roles
 * @param {...String} roles - Roles allowed to access the route
 */
module.exports = (...roles) => {
  return catchAsync(async (req, res, next) => {
    // 1) Extract token from cookie or authorization header
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if user is suspended (anti-fraud control)
    if (currentUser.status === 'suspended') {
      return next(new AppError('Your account has been suspended. Please contact support.', 403));
    }

    // 5) Check role authorization if roles are defined
    if (roles.length && !roles.includes(currentUser.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    // Grant access to protected route and store user info in request context
    req.user = currentUser;
    next();
  });
};

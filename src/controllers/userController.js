const User = require('../models/User');
const Wallet = require('../models/Wallet');
const generateToken = require('../utils/generateToken');
const transporter = require('../../config/mailer');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User already exists with this email address.', 409));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'user',
  });

  // Automatically initialize user's wallet
  await Wallet.create({ user: user._id });

  // Send welcome email (asynchronous, do not block registration)
  transporter.sendMail({
    to: user.email,
    subject: 'Welcome to VaultMaal',
    text: `Hi ${user.name},\n\nWelcome to VaultMaal - Pakistan's premium live-streaming e-commerce and real-time bidding platform! Make a deposit in your wallet to start bidding.\n\nBest regards,\nVaultMaal Team`,
  }).catch((err) => console.error('Welcome email sending failed:', err.message));

  // Generate Token and set Cookie
  const token = generateToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password, user.password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // Check if user is suspended
  if (user.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  // Generate token and set Cookie
  const token = generateToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

exports.profile = catchAsync(async (req, res, next) => {
  // User is already fetched and attached in the auth middleware
  const user = req.user;

  // Populate wallet balance along with user profile
  const wallet = await Wallet.findOne({ user: user._id });

  res.status(200).json({
    status: 'success',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      wallet: wallet
        ? {
            balance: wallet.balance,
            refundableDeposit: wallet.refundableDeposit,
            currency: wallet.currency,
          }
        : null,
    },
  });
});

const User = require('../models/User');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const Transaction = require('../models/Transaction');
const Stream = require('../models/Stream');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password').sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: users.length,
    users,
  });
});

exports.updateUserStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body; // 'active' or 'suspended'
  
  if (!['active', 'suspended'].includes(status)) {
    return next(new AppError('Invalid status value.', 400));
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  user.status = status;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: `User account has been ${status === 'active' ? 'activated' : 'suspended'} successfully.`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

exports.getStats = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalBids = await Bid.countDocuments();
  
  // Calculate total transaction volume
  const transactionStats = await Transaction.aggregate([
    { $match: { status: 'completed', type: 'deposit' } },
    { $group: { _id: null, totalVolume: { $sum: '$amount' } } },
  ]);
  const totalDepositVolume = transactionStats.length > 0 ? transactionStats[0].totalVolume : 0;

  const activeLiveStreams = await Stream.countDocuments({ status: 'live' });

  res.status(200).json({
    status: 'success',
    stats: {
      totalUsers,
      totalProducts,
      totalBids,
      totalDepositVolume,
      activeLiveStreams,
    },
  });
});

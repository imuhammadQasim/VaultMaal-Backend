const walletService = require('../services/walletService');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getWallet = catchAsync(async (req, res, next) => {
  const wallet = await walletService.getOrCreateWallet(req.user.id);
  
  // Fetch transactions list
  const transactions = await Transaction.find({ wallet: wallet._id })
    .sort('-createdAt')
    .limit(50);

  res.status(200).json({
    status: 'success',
    wallet: {
      id: wallet._id,
      balance: wallet.balance,
      refundableDeposit: wallet.refundableDeposit,
      currency: wallet.currency,
    },
    transactions,
  });
});

exports.deposit = catchAsync(async (req, res, next) => {
  const { amount, paymentMethod, paymentReference, description } = req.body;

  const result = await walletService.depositFunds(
    req.user.id,
    amount,
    paymentMethod,
    paymentReference,
    description
  );

  res.status(200).json({
    status: 'success',
    message: 'Deposit processed successfully.',
    wallet: {
      balance: result.wallet.balance,
      refundableDeposit: result.wallet.refundableDeposit,
    },
    transaction: result.transaction,
  });
});

exports.lockDeposit = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const holdAmount = amount || 500; // default Rs. 500

  const wallet = await walletService.holdRefundableDeposit(req.user.id, holdAmount);

  res.status(200).json({
    status: 'success',
    message: `Locked Rs. ${holdAmount} as a refundable bidding deposit. You are now authorized to bid!`,
    wallet: {
      balance: wallet.balance,
      refundableDeposit: wallet.refundableDeposit,
    },
  });
});

exports.unlockDeposit = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const releaseAmount = amount || 500; // default Rs. 500

  const wallet = await walletService.releaseRefundableDeposit(req.user.id, releaseAmount);

  res.status(200).json({
    status: 'success',
    message: `Released Rs. ${releaseAmount} to your active balance.`,
    wallet: {
      balance: wallet.balance,
      refundableDeposit: wallet.refundableDeposit,
    },
  });
});

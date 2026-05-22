const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');

/**
 * Get a user's wallet or create one if it doesn't exist
 * @param {String} userId 
 */
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }
  return wallet;
};

/**
 * Deposit funds to a user's wallet
 */
const depositFunds = async (userId, amount, paymentMethod, paymentReference, description) => {
  const wallet = await getOrCreateWallet(userId);

  // Create a pending transaction record first
  const transaction = await Transaction.create({
    wallet: wallet._id,
    user: userId,
    type: 'deposit',
    amount,
    status: 'completed', // Auto-completed for demonstration, would be 'pending' if requiring admin verification
    paymentMethod,
    paymentReference,
    description: description || 'Wallet cash deposit',
  });

  // Update wallet balance atomically
  const updatedWallet = await Wallet.findOneAndUpdate(
    { _id: wallet._id },
    { $inc: { balance: amount } },
    { new: true }
  );

  return { wallet: updatedWallet, transaction };
};

/**
 * Lock refundable token deposit for bidding eligibility (e.g. Rs. 500 or 1000)
 */
const holdRefundableDeposit = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < amount) {
    throw new AppError(`Insufficient balance. You need Rs. ${amount} in your wallet to lock as a refundable bidding deposit.`, 400);
  }

  // Atomically transfer from balance to refundableDeposit
  const updatedWallet = await Wallet.findOneAndUpdate(
    { _id: wallet._id, balance: { $gte: amount } },
    { 
      $inc: { 
        balance: -amount,
        refundableDeposit: amount 
      } 
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw new AppError('Hold deposit failed. Insufficient funds.', 400);
  }

  await Transaction.create({
    wallet: wallet._id,
    user: userId,
    type: 'hold',
    amount,
    status: 'completed',
    paymentMethod: 'wallet',
    description: `Bidding registration refundable deposit hold: Rs. ${amount}`,
  });

  return updatedWallet;
};

/**
 * Release locked refundable deposit back to main wallet balance
 */
const releaseRefundableDeposit = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);

  if (wallet.refundableDeposit < amount) {
    throw new AppError('Release failed. Request amount exceeds locked deposits.', 400);
  }

  // Atomically transfer from refundableDeposit back to balance
  const updatedWallet = await Wallet.findOneAndUpdate(
    { _id: wallet._id, refundableDeposit: { $gte: amount } },
    { 
      $inc: { 
        balance: amount,
        refundableDeposit: -amount 
      } 
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw new AppError('Release deposit failed. Insufficient locked funds.', 400);
  }

  await Transaction.create({
    wallet: wallet._id,
    user: userId,
    type: 'refund',
    amount,
    status: 'completed',
    paymentMethod: 'wallet',
    description: `Refundable deposit released: Rs. ${amount}`,
  });

  return updatedWallet;
};

/**
 * Process product purchase/payment
 */
const processPayment = async (buyerId, sellerId, amount, productId, description) => {
  const buyerWallet = await getOrCreateWallet(buyerId);
  
  // Check if buyer has enough balance
  if (buyerWallet.balance < amount) {
    throw new AppError('Payment failed. Insufficient balance in wallet.', 400);
  }

  // Deduct from buyer
  const updatedBuyerWallet = await Wallet.findOneAndUpdate(
    { _id: buyerWallet._id, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!updatedBuyerWallet) {
    throw new AppError('Payment transaction failed.', 400);
  }

  // Add to seller
  const sellerWallet = await getOrCreateWallet(sellerId);
  await Wallet.findOneAndUpdate(
    { _id: sellerWallet._id },
    { $inc: { balance: amount } }
  );

  // Log transaction for buyer
  await Transaction.create({
    wallet: buyerWallet._id,
    user: buyerId,
    type: 'payment',
    amount,
    status: 'completed',
    paymentMethod: 'wallet',
    description: description || `Payment for product ID: ${productId}`,
  });

  // Log deposit for seller
  await Transaction.create({
    wallet: sellerWallet._id,
    user: sellerId,
    type: 'deposit',
    amount,
    status: 'completed',
    paymentMethod: 'wallet',
    description: `Received payment for product ID: ${productId} from buyer ${buyerId}`,
  });

  return updatedBuyerWallet;
};

module.exports = {
  getOrCreateWallet,
  depositFunds,
  holdRefundableDeposit,
  releaseRefundableDeposit,
  processPayment,
};

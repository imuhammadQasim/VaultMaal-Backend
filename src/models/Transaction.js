const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Transaction must be associated with a wallet'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user'],
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'refund', 'payment', 'hold'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['easypaisa', 'jazzcash', 'bank_transfer', 'wallet'],
      required: [true, 'Payment method is required'],
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

// Indexes for transaction history lookup
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ wallet: 1 });
transactionSchema.index({ paymentReference: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);

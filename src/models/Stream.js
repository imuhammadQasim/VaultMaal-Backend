const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Stream title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    streamer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Streamer/Host is required'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    streamKey: {
      type: String,
      select: false, // Stream keys are sensitive
    },
    streamUrl: {
      type: String,
    },
    activeProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    viewersCount: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
streamSchema.index({ status: 1 });
streamSchema.index({ streamer: 1 });

module.exports = mongoose.model('Stream', streamSchema);

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: ['b2c', 'b2b'],
      default: 'b2c',
    },
    startingPrice: {
      type: Number,
      required: [true, 'Starting price is required'],
      min: [0, 'Starting price cannot be negative'],
    },
    currentPrice: {
      type: Number,
      default: function () {
        return this.startingPrice;
      },
    },
    reservePrice: {
      type: Number,
      min: [0, 'Reserve price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'sold', 'unsold'],
      default: 'draft',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    endDateTime: {
      type: Date,
      required: [true, 'Auction end date/time is required'],
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bidsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for faster search and query performance
productSchema.index({ status: 1, type: 1 });
productSchema.index({ endDateTime: 1 });

module.exports = mongoose.model('Product', productSchema);

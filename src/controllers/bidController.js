const biddingService = require('../services/biddingService');
const Bid = require('../models/Bid');
const catchAsync = require('../utils/catchAsync');

exports.placeBid = catchAsync(async (req, res, next) => {
  const { bidAmount } = req.body;
  const productId = req.params.productId;
  const bidderId = req.user.id;

  const result = await biddingService.placeBid(productId, bidderId, bidAmount);

  res.status(201).json({
    status: 'success',
    message: 'Bid placed successfully!',
    ...result,
  });
});

exports.getProductBids = catchAsync(async (req, res, next) => {
  const bids = await Bid.find({ product: req.params.productId })
    .populate('bidder', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bids.length,
    bids,
  });
});

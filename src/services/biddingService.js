const Product = require('../models/Product');
const Bid = require('../models/Bid');
const Wallet = require('../models/Wallet');
const AppError = require('../utils/AppError');

/**
 * Place a bid on a product
 */
const placeBid = async (productId, bidderId, bidAmount) => {
  // 1) Fetch product and verify existence
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  // 2) Validate auction state
  if (product.status !== 'active') {
    throw new AppError('Auction is not active for this product.', 400);
  }

  if (new Date() > new Date(product.endDateTime)) {
    // Auto-update status to ended/sold/unsold if past time
    product.status = product.currentPrice > (product.reservePrice || 0) ? 'sold' : 'unsold';
    await product.save();
    throw new AppError('This auction has already ended.', 400);
  }

  // 3) Validate bidder is not the seller
  if (product.seller.toString() === bidderId.toString()) {
    throw new AppError('Sellers cannot bid on their own products.', 400);
  }

  // 4) Validate bid amount is greater than current price
  const minBidRequired = product.currentPrice + 1; // Minimum increment of Rs. 1
  if (bidAmount < minBidRequired) {
    throw new AppError(`Bid amount must be at least Rs. ${minBidRequired} (greater than current bid Rs. ${product.currentPrice}).`, 400);
  }

  // 5) Anti-fraud wallet check: verify refundable deposit is >= Rs. 500
  const wallet = await Wallet.findOne({ user: bidderId });
  const minimumDepositRequired = 500; // Rs. 500 token deposit required for bidding
  if (!wallet || wallet.refundableDeposit < minimumDepositRequired) {
    throw new AppError(`Bidding unauthorized. You must lock a refundable token deposit of at least Rs. ${minimumDepositRequired} in your wallet before placing bids.`, 403);
  }

  // 6) Transactional placement: update previous winning bids
  await Bid.updateMany(
    { product: productId, isWinning: true },
    { isWinning: false }
  );

  // 7) Create the new bid
  const bid = await Bid.create({
    product: productId,
    bidder: bidderId,
    bidAmount,
    isWinning: true,
  });

  // 8) Update product details (currentPrice, bidsCount)
  product.currentPrice = bidAmount;
  product.bidsCount += 1;
  await product.save();

  return { bid, product };
};

/**
 * Finalize/End an auction (called automatically or by scheduler/admin)
 */
const finalizeAuction = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);
  if (product.status !== 'active') throw new AppError('Product is not active', 400);

  // Check if there is a winning bid
  const winningBid = await Bid.findOne({ product: productId, isWinning: true }).populate('bidder');

  if (winningBid) {
    // Determine if it meets reserve price (if any)
    if (!product.reservePrice || winningBid.bidAmount >= product.reservePrice) {
      product.status = 'sold';
      product.winner = winningBid.bidder._id;
    } else {
      product.status = 'unsold'; // Didn't meet reserve price
    }
  } else {
    product.status = 'unsold';
  }

  await product.save();
  return product;
};

module.exports = {
  placeBid,
  finalizeAuction,
};

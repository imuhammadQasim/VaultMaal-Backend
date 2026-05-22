const Order = require('../models/Order');
const Product = require('../models/Product');
const walletService = require('../services/walletService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createOrder = catchAsync(async (req, res, next) => {
  const { productId, shippingAddress } = req.body;
  const buyerId = req.user.id;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  // Check if product is already sold
  const existingOrder = await Order.findOne({ product: productId });
  if (existingOrder) {
    return next(new AppError('This product has already been sold.', 400));
  }

  // Business check: If this is an auction listing, only the winning bidder can checkout!
  if (product.type === 'b2c' && product.status === 'sold') {
    if (!product.winner || product.winner.toString() !== buyerId.toString()) {
      return next(new AppError('Only the winning bidder of the auction can purchase this product.', 403));
    }
  }

  const orderAmount = product.currentPrice;

  // Process payment atomically from buyer's wallet to seller's wallet
  await walletService.processPayment(
    buyerId,
    product.seller,
    orderAmount,
    product._id,
    `Payment for order: ${product.title}`
  );

  // Create order
  const order = await Order.create({
    buyer: buyerId,
    product: productId,
    amount: orderAmount,
    paymentStatus: 'paid',
    shippingAddress,
    shippingStatus: 'pending',
  });

  // Update product state to sold
  product.status = 'sold';
  product.winner = buyerId;
  await product.save();

  res.status(201).json({
    status: 'success',
    message: 'Order placed and paid successfully!',
    order,
  });
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ buyer: req.user.id })
    .populate({
      path: 'product',
      select: 'title description images category startingPrice currentPrice seller',
      populate: { path: 'seller', select: 'name email' },
    })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: orders.length,
    orders,
  });
});

exports.getVendorOrders = catchAsync(async (req, res, next) => {
  // Find products sold by this vendor
  const products = await Product.find({ seller: req.user.id });
  const productIds = products.map((p) => p._id);

  // Find orders matching these products
  const orders = await Order.find({ product: { $in: productIds } })
    .populate('buyer', 'name email')
    .populate('product', 'title currentPrice startingPrice')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: orders.length,
    orders,
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { shippingStatus } = req.body;
  const order = await Order.findById(req.params.id).populate('product');

  if (!order) {
    return next(new AppError('Order not found.', 404));
  }

  // Authorization check: Only product seller or Admin can change shipping status
  if (order.product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this order status.', 403));
  }

  order.shippingStatus = shippingStatus;
  await order.save();

  res.status(200).json({
    status: 'success',
    message: `Order status updated to ${shippingStatus}`,
    order,
  });
});

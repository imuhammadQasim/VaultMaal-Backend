const Product = require('../models/Product');
const Bid = require('../models/Bid');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createProduct = catchAsync(async (req, res, next) => {
  // Add seller reference from authenticated user
  const productData = {
    ...req.body,
    seller: req.user.id,
  };

  const product = await Product.create(productData);

  res.status(201).json({
    status: 'success',
    product,
  });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  // Destructure filter parameters
  const { category, type, status, search, sort } = req.query;

  // Build filter query object
  const query = {};

  if (category) query.category = category;
  if (type) query.type = type;
  if (status) query.status = status;
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Find products
  let productsQuery = Product.find(query).populate('seller', 'name email');

  // Sorting
  if (sort) {
    const sortBy = sort.split(',').join(' ');
    productsQuery = productsQuery.sort(sortBy);
  } else {
    productsQuery = productsQuery.sort('-createdAt'); // Default sorting: newest first
  }

  const products = await productsQuery;

  res.status(200).json({
    status: 'success',
    results: products.length,
    products,
  });
});

exports.getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name email')
    .populate('winner', 'name email');

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  // Fetch bid history for this product
  const bids = await Bid.find({ product: product._id })
    .populate('bidder', 'name')
    .sort('-bidAmount')
    .limit(20);

  res.status(200).json({
    status: 'success',
    product,
    bids,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  // Check authorization: Admin or Product seller
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this product listing.', 403));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    product,
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  // Check authorization: Admin or Product seller
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this product listing.', 403));
  }

  // Soft delete or hard delete. Here we will hard delete for simplicity
  await Product.findByIdAndDelete(req.params.id);

  // Clean up associated bids
  await Bid.deleteMany({ product: product._id });

  res.status(200).json({
    status: 'success',
    message: 'Product listing deleted successfully',
  });
});

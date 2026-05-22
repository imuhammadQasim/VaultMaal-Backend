const Stream = require('../models/Stream');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');

exports.createStream = catchAsync(async (req, res, next) => {
  const { title, description, streamUrl } = req.body;

  // Generate a random secure stream key for AWS IVS or Agora
  const streamKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;

  const stream = await Stream.create({
    title,
    description,
    streamer: req.user.id,
    streamKey,
    streamUrl: streamUrl || `rtmp://live.vaultmaal.com/app/${streamKey}`,
    status: 'scheduled',
  });

  res.status(201).json({
    status: 'success',
    stream,
  });
});

exports.getLiveStreams = catchAsync(async (req, res, next) => {
  const streams = await Stream.find({ status: 'live' })
    .populate('streamer', 'name email')
    .populate('activeProduct', 'title currentPrice startingPrice images');

  res.status(200).json({
    status: 'success',
    results: streams.length,
    streams,
  });
});

exports.updateStream = catchAsync(async (req, res, next) => {
  const stream = await Stream.findById(req.params.id);

  if (!stream) {
    return next(new AppError('Stream session not found.', 404));
  }

  // Verify ownership
  if (stream.streamer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this stream.', 403));
  }

  const { status, title, description, streamUrl, activeProductId } = req.body;

  if (title) stream.title = title;
  if (description) stream.description = description;
  if (streamUrl) stream.streamUrl = streamUrl;

  if (status) {
    stream.status = status;
    if (status === 'live' && !stream.startedAt) {
      stream.startedAt = new Date();
    } else if (status === 'ended') {
      stream.endedAt = new Date();
    }
  }

  if (activeProductId !== undefined) {
    if (activeProductId === null) {
      stream.activeProduct = null;
    } else {
      const product = await Product.findById(activeProductId);
      if (!product) return next(new AppError('Product not found.', 404));

      // Automatically set product status to active when featured on live stream
      product.status = 'active';
      await product.save();

      stream.activeProduct = activeProductId;
    }
  }

  await stream.save();

  res.status(200).json({
    status: 'success',
    stream,
  });
});

exports.endStream = catchAsync(async (req, res, next) => {
  const stream = await Stream.findById(req.params.id);

  if (!stream) {
    return next(new AppError('Stream session not found.', 404));
  }

  if (stream.streamer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to end this stream.', 403));
  }

  stream.status = 'ended';
  stream.endedAt = new Date();
  stream.activeProduct = null;
  await stream.save();

  res.status(200).json({
    status: 'success',
    message: 'Stream session ended successfully.',
    stream,
  });
});

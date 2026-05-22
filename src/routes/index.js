const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const adminRoutes = require('./admin');
const productRoutes = require('./product');
const bidRoutes = require('./bid');
const walletRoutes = require('./wallet');
const orderRoutes = require('./order');
const streamRoutes = require('./stream');

// Mount routes to namespace pathways
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/bids', bidRoutes);
router.use('/wallet', walletRoutes);
router.use('/orders', orderRoutes);
router.use('/streams', streamRoutes);

module.exports = router;

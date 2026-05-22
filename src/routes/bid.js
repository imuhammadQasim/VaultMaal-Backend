const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');
const schemas = require('../utils/validationSchemas');
const { bidLimiter } = require('../middleware/rateLimiter');

// Public route to see bids for a product
router.get('/:productId', bidController.getProductBids);

// Protected route to place a bid (Only authenticated users, subject to bid rate limiters)
router.post(
  '/:productId',
  auth('user', 'admin'), // Vendors usually don't bid, but user/admin can
  bidLimiter,
  validate(schemas.placeBid),
  bidController.placeBid
);

module.exports = router;

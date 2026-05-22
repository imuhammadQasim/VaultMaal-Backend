const Joi = require('joi');

const schemas = {
  // Auth schemas
  register: Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.empty': 'Password is required',
    }),
    role: Joi.string().valid('user', 'vendor').default('user'),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
    }),
  }),

  // Product schemas
  createProduct: Joi.object({
    title: Joi.string().required().max(100),
    description: Joi.string().required(),
    type: Joi.string().valid('b2c', 'b2b').default('b2c'),
    startingPrice: Joi.number().positive().required(),
    reservePrice: Joi.number().positive().optional(),
    category: Joi.string().required(),
    endDateTime: Joi.date().greater('now').required().messages({
      'date.greater': 'End date must be in the future',
    }),
    images: Joi.array().items(Joi.string().uri()).optional(),
  }),

  updateProduct: Joi.object({
    title: Joi.string().max(100).optional(),
    description: Joi.string().optional(),
    type: Joi.string().valid('b2c', 'b2b').optional(),
    startingPrice: Joi.number().positive().optional(),
    reservePrice: Joi.number().positive().optional(),
    category: Joi.string().optional(),
    endDateTime: Joi.date().greater('now').optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    status: Joi.string().valid('draft', 'active', 'sold', 'unsold').optional(),
  }),

  // Bid schemas
  placeBid: Joi.object({
    bidAmount: Joi.number().positive().required().messages({
      'number.positive': 'Bid amount must be greater than zero',
    }),
  }),

  // Wallet and Transaction schemas
  deposit: Joi.object({
    amount: Joi.number().positive().min(100).required().messages({
      'number.min': 'Minimum deposit amount is Rs. 100',
    }),
    paymentMethod: Joi.string().valid('easypaisa', 'jazzcash', 'bank_transfer').required(),
    paymentReference: Joi.string().required().messages({
      'string.empty': 'Payment reference transaction ID is required',
    }),
    description: Joi.string().max(200).optional(),
  }),

  refundDeposit: Joi.object({
    amount: Joi.number().positive().required(),
  }),

  // Order schemas
  createOrder: Joi.object({
    productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid product ID',
    }),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().optional(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('Pakistan'),
    }).required(),
  }),

  updateOrderStatus: Joi.object({
    shippingStatus: Joi.string().valid('pending', 'shipped', 'delivered', 'cancelled').required(),
  }),

  // Stream schemas
  createStream: Joi.object({
    title: Joi.string().required().max(100),
    description: Joi.string().max(500).optional(),
    streamUrl: Joi.string().uri().optional(),
  }),

  updateStream: Joi.object({
    title: Joi.string().max(100).optional(),
    description: Joi.string().max(500).optional(),
    status: Joi.string().valid('scheduled', 'live', 'ended').optional(),
    streamUrl: Joi.string().uri().optional(),
    activeProductId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(null),
  }),
};

module.exports = schemas;

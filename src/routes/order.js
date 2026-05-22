const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');
const schemas = require('../utils/validationSchemas');

// Require authentication for all order endpoints
router.use(auth());

router.post('/', validate(schemas.createOrder), orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/vendor-orders', auth('vendor', 'admin'), orderController.getVendorOrders);
router.patch('/:id/status', validate(schemas.updateOrderStatus), orderController.updateOrderStatus);

module.exports = router;

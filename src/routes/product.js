const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');
const schemas = require('../utils/validationSchemas');

// Public route to view products
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes (Only Admins and Vendors can create product listings)
router.post(
  '/',
  auth('admin', 'vendor'),
  validate(schemas.createProduct),
  productController.createProduct
);

// Seller/Admin protected routes
router.patch(
  '/:id',
  auth('admin', 'vendor', 'user'), // Controller will check if the user is the actual seller or admin
  validate(schemas.updateProduct),
  productController.updateProduct
);

router.delete(
  '/:id',
  auth('admin', 'vendor', 'user'), // Controller will verify ownership
  productController.deleteProduct
);

module.exports = router;

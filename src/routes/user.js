const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');
const schemas = require('../utils/validationSchemas');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with validation and rate limiting
router.post('/register', authLimiter, validate(schemas.register), userController.register);
router.post('/login', authLimiter, validate(schemas.login), userController.login);
router.post('/logout', userController.logout);

// Protected routes
router.get('/profile', auth(), userController.profile);

module.exports = router;

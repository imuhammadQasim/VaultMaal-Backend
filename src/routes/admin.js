const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Restrict all routes defined below to Admin role only
router.use(auth('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.get('/stats', adminController.getStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');
const schemas = require('../utils/validationSchemas');

// Require authentication for all wallet endpoints
router.use(auth());

router.get('/', walletController.getWallet);
router.post('/deposit', validate(schemas.deposit), walletController.deposit);
router.post('/lock-deposit', walletController.lockDeposit);
router.post('/unlock-deposit', walletController.unlockDeposit);

module.exports = router;

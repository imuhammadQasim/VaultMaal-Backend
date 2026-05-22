const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');
const schemas = require('../utils/validationSchemas');

// Public route to view active streams
router.get('/live', streamController.getLiveStreams);

// Protected routes (Only Admins and Vendors can schedule or manage streams)
router.use(auth('admin', 'vendor'));

router.post('/', validate(schemas.createStream), streamController.createStream);
router.patch('/:id', validate(schemas.updateStream), streamController.updateStream);
router.post('/:id/end', streamController.endStream);

module.exports = router;

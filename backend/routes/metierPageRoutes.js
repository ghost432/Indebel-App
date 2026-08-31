const express = require('express');
const router = express.Router();
const controller = require('../controllers/metierPageController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), controller.getAllPages);
router.get('/:slug', controller.getPublicPage);
router.put('/:id', authenticate, authorize('admin'), controller.updatePage);

module.exports = router;

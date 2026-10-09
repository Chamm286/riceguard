const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin', 'analyst'), assetController.getAll);
router.get('/stats', verifyToken, requireRole('admin', 'analyst'), assetController.getStats);
router.get('/:id', verifyToken, requireRole('admin', 'analyst'), assetController.getById);

module.exports = router;

const express = require('express');
const router = express.Router();
const threatController = require('../controllers/threat.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin', 'analyst'), threatController.getAll);
router.get('/stats', verifyToken, requireRole('admin', 'analyst'), threatController.getStats);
router.post('/:id/block', verifyToken, requireRole('admin', 'analyst'), threatController.block);
router.post('/:id/watch', verifyToken, requireRole('admin', 'analyst'), threatController.watch);

module.exports = router;


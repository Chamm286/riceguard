const express = require('express');
const router = express.Router();
const investigationController = require('../controllers/investigation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin', 'analyst'), investigationController.getAll);
router.get('/stats', verifyToken, requireRole('admin', 'analyst'), investigationController.getStats);
router.put('/:id/progress', verifyToken, requireRole('admin', 'analyst'), investigationController.updateProgress);

module.exports = router;

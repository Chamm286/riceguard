const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin', 'analyst'), logController.getAll);
router.get('/stats', verifyToken, requireRole('admin', 'analyst'), logController.getStats);

module.exports = router;

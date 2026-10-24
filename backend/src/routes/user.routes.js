const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin'), userController.getAll);
router.put('/:id/status', verifyToken, requireRole('admin'), userController.updateStatus);

module.exports = router;

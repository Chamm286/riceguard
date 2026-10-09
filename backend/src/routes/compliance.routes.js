const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/compliance.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin', 'analyst'), complianceController.getAll);
router.get('/stats', verifyToken, requireRole('admin', 'analyst'), complianceController.getStats);
router.get('/by-framework', verifyToken, requireRole('admin', 'analyst'), complianceController.getByFramework);

module.exports = router;

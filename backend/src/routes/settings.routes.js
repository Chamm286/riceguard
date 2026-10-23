const express = require('express');
const router = express.Router();
const c = require('../controllers/settings.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/security', verifyToken, requireRole('admin', 'analyst'), c.getSecuritySettings);
router.put('/security', verifyToken, requireRole('admin', 'analyst'), c.updateSecuritySettings);

module.exports = router;

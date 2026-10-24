const express = require('express');
const router = express.Router();
const controller = require('../controllers/system.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/status', verifyToken, requireRole('admin', 'analyst'), controller.getStatus);
router.get('/activity', verifyToken, requireRole('admin', 'analyst'), controller.getActivity);

module.exports = router;

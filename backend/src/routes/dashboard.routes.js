const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/stats', verifyToken, requireRole('admin', 'analyst'), dashboardController.getStats);
router.get('/alerts-by-severity', verifyToken, requireRole('admin', 'analyst'), dashboardController.getAlertsBySeverity);
router.get('/alerts-by-category', verifyToken, requireRole('admin', 'analyst'), dashboardController.getAlertsByCategory);
router.get('/alerts-timeline', verifyToken, requireRole('admin', 'analyst'), dashboardController.getAlertsTimeline);
router.get('/recent-alerts', verifyToken, requireRole('admin', 'analyst'), dashboardController.getRecentAlerts);

module.exports = router;

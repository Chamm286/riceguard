const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { trackVisitor } = require('../middlewares/track-visitor.middleware');

router.post('/track', trackVisitor, (req, res) => res.json({ success: true }));
router.get('/', verifyToken, visitorController.list);
router.get('/stats', verifyToken, visitorController.stats);
router.get('/map', verifyToken, visitorController.map);
router.get('/suspicious', verifyToken, visitorController.suspicious);
router.get('/alerts', verifyToken, visitorController.visitorAlerts);
router.post('/geocode-missing', verifyToken, visitorController.geocodeMissing);

module.exports = router;

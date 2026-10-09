const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin', 'analyst'), workflowController.getAll);
router.get('/stats', verifyToken, requireRole('admin', 'analyst'), workflowController.getStats);
router.post('/:id/toggle', verifyToken, requireRole('admin', 'analyst'), workflowController.toggle);
router.post('/:id/run', verifyToken, requireRole('admin', 'analyst'), workflowController.run);

module.exports = router;

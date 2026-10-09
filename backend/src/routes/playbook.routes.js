const express = require('express');
const router = express.Router();
const playbookController = require('../controllers/playbook.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', verifyToken, requireRole('admin', 'analyst'), playbookController.getAll);
router.get('/stats', verifyToken, requireRole('admin', 'analyst'), playbookController.getStats);
router.post('/:id/run', verifyToken, requireRole('admin', 'analyst'), playbookController.run);

module.exports = router;

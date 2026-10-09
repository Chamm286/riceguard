const express = require('express');
const router = express.Router();
const n8nController = require('../controllers/n8n.controller');

// n8n gọi vào (không cần auth - n8n tự xác thực qua IP nội bộ)
router.post('/webhook/alert-update', n8nController.updateAlertFromN8n);
router.post('/webhook/block-ip', n8nController.blockIPFromN8n);
router.post('/webhook/notify', n8nController.createNotificationFromN8n);
router.post('/webhook/log-run', n8nController.logWorkflowRun);

module.exports = router;

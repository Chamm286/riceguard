const express = require('express');
const router = express.Router();
const c = require('../controllers/n8n.controller');

router.post('/alert', c.updateAlertFromN8n);
router.post('/block-ip', c.blockIPFromN8n);
router.post('/log', c.saveLogFromN8n);

module.exports = router;

const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/field.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, fieldController.getAll);
router.get('/:id', verifyToken, fieldController.getById);

module.exports = router;

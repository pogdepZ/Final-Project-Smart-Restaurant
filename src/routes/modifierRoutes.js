const express = require('express');
const router = express.Router();
const modifierController = require('../controllers/modifierController');

router.get('/', modifierController.getModifiers);
router.post('/', modifierController.createModifierGroup);
router.post('/attach', modifierController.attachToItem);

module.exports = router;
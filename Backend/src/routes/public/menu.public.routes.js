const express = require('express');
const router = express.Router();

const menuController = require('../../controllers/menuController');
const photoController = require('../../controllers/photoController');

// Categories public
router.get('/categories', menuController.getCategories);

// Items public
router.get('/items', menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItemById);

// Photos public (nếu khách cần xem gallery)
router.get('/items/:id/photos', photoController.getItemPhotos);

module.exports = router;

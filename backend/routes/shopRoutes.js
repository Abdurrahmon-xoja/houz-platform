const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShopById);
router.post('/', authMiddleware, shopController.createShop);
router.put('/:id', authMiddleware, shopController.updateShop);
router.delete('/:id', authMiddleware, shopController.deleteShop);

module.exports = router;

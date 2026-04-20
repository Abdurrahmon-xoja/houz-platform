const { Shop, SubCategory, Category } = require('../models');
const { Op } = require('sequelize');

exports.getAllShops = async (req, res) => {
    try {
        const { category, search } = req.query;
        let whereClause = { isActive: true };

        if (search) {
            whereClause.name = { [Op.iLike]: `%${search}%` };
        }
        if (category) {
            whereClause.CategoryId = category;
        }

        const shops = await Shop.findAll({
            where: whereClause,
            include: [
                { model: SubCategory, through: { attributes: [] } },
                { model: Category, attributes: ['id', 'name', 'slug', 'icon'] }
            ]
        });

        for (let i = shops.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shops[i], shops[j]] = [shops[j], shops[i]];
        }

        res.json({ success: true, data: shops });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getShopById = async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id, {
            include: [
                { model: SubCategory, through: { attributes: [] } },
                { model: Category, attributes: ['id', 'name', 'slug', 'icon'] }
            ]
        });
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        res.json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createShop = async (req, res) => {
    try {
        // Create the Shop record
        const shop = await Shop.create(req.body);
        
        // Handle Many-to-Many SubCategory linking
        const subCats = req.body.SubCategories || req.body.subCategoryIds;
        if (subCats && subCats.length) {
            await shop.setSubCategories(subCats);
        }

        // Fetch the created record with relationships attached
        const updatedShop = await Shop.findByPk(shop.id, {
            include: [
                { model: SubCategory, through: { attributes: [] } },
                { model: Category, attributes: ['id', 'name', 'slug', 'icon'] }
            ]
        });
        
        res.json({ success: true, data: updatedShop });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateShop = async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        
        await shop.update(req.body);

        // Update Many-to-Many relationships if provided
        const subCats = req.body.SubCategories || req.body.subCategoryIds;
        if (subCats) {
            await shop.setSubCategories(subCats);
        }

        // Fetch properly nested response
        const updatedShop = await Shop.findByPk(shop.id, {
            include: [
                { model: SubCategory, through: { attributes: [] } },
                { model: Category, attributes: ['id', 'name', 'slug', 'icon'] }
            ]
        });

        res.json({ success: true, data: updatedShop });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        
        await shop.destroy();
        res.json({ success: true, message: 'Shop deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

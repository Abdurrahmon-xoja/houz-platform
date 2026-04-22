const { Shop, ShopImage, SubCategory, Category } = require('../models');
const { Op } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const shopIncludes = [
    { model: SubCategory, through: { attributes: [] } },
    { model: Category, attributes: ['id', 'name', 'slug', 'icon'] },
    { model: ShopImage, attributes: ['id', 'url', 'order'] }
];

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

        const shops = await Shop.findAll({ where: whereClause, include: shopIncludes });

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
        const shop = await Shop.findByPk(req.params.id, { include: shopIncludes });
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        res.json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createShop = async (req, res) => {
    try {
        const shop = await Shop.create(req.body);

        const subCats = req.body.SubCategories || req.body.subCategoryIds;
        if (subCats && subCats.length) {
            await shop.setSubCategories(subCats);
        }

        const updatedShop = await Shop.findByPk(shop.id, { include: shopIncludes });
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

        const subCats = req.body.SubCategories || req.body.subCategoryIds;
        if (subCats) {
            await shop.setSubCategories(subCats);
        }

        const updatedShop = await Shop.findByPk(shop.id, { include: shopIncludes });
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

exports.addShopImage = async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        const count = await ShopImage.count({ where: { ShopId: req.params.id } });
        if (count >= 3) {
            return res.status(400).json({ success: false, message: 'Max 3 images per shop' });
        }

        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const processedBuffer = await sharp(req.file.buffer)
            .resize(1000, 1000, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 85 })
            .toBuffer();

        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'houz_shops_gallery' },
            async (error, result) => {
                if (error) return res.status(500).json({ success: false, message: error.message });
                const image = await ShopImage.create({ url: result.secure_url, order: count, ShopId: req.params.id });
                res.json({ success: true, data: image });
            }
        );
        uploadStream.end(processedBuffer);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteShopImage = async (req, res) => {
    try {
        const image = await ShopImage.findOne({ where: { id: req.params.imageId, ShopId: req.params.id } });
        if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

        await image.destroy();

        const remaining = await ShopImage.findAll({ where: { ShopId: req.params.id }, order: [['order', 'ASC']] });
        for (let i = 0; i < remaining.length; i++) {
            await remaining[i].update({ order: i });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.reorderShopImages = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ success: false, message: 'ids must be an array' });
        }
        for (let i = 0; i < ids.length; i++) {
            await ShopImage.update({ order: i }, { where: { id: ids[i], ShopId: req.params.id } });
        }
        const images = await ShopImage.findAll({ where: { ShopId: req.params.id }, order: [['order', 'ASC']] });
        res.json({ success: true, data: images });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

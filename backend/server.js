const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const { initDb, User, Shop, Category, SubCategory, Product } = require('./database');
const { Op } = require('sequelize'); // Import Op for Sequelize operators

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files from 'frontend' directory

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../frontend/img');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename and append unique suffix
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

// Database Initialization
initDb();

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// --- API Routes ---

// Login API
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Upload API (Protected)
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Return path relative to frontend root (e.g., /img/filename.jpg)
    res.json({ success: true, data: { url: `/img/${req.file.filename}` } });
});

// --- Shops CRUD ---

// Get All Shops (Public) - supports ?search= & ?category=
app.get('/api/shops', async (req, res) => {
    try {
        const { search, category, subcategory } = req.query;
        const whereClause = {};
        const includeClause = [
            { model: Category }, // Include Category by default
            { model: SubCategory } // Include SubCategory by default
        ];

        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        if (category) {
            // Filter by Category slug by querying the associated Category model
            includeClause[0].where = { slug: category };
        }
        
        if (subcategory) {
            includeClause[1].where = { slug: subcategory };
        }

        const shops = await Shop.findAll({
            where: whereClause,
            include: includeClause
        });
        res.json({ success: true, data: shops });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Single Shop (Public)
app.get('/api/shops/:id', async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id, {
            include: [Category, SubCategory] // Include category and subcategory details
        });
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        res.json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create Shop (Protected)
app.post('/api/shops', authMiddleware, async (req, res) => {
    try {
        const { subCategoryIds, ...shopData } = req.body;
        const shop = await Shop.create(shopData);
        if (subCategoryIds && Array.isArray(subCategoryIds)) {
            await shop.setSubCategories(subCategoryIds);
        }
        // Fetch it again to include the relations for the response if necessary, or just return shop
        res.json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Shop (Protected)
app.put('/api/shops/:id', authMiddleware, async (req, res) => {
    try {
        const { subCategoryIds, ...shopData } = req.body;
        const shop = await Shop.findByPk(req.params.id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        
        await shop.update(shopData);
        if (subCategoryIds && Array.isArray(subCategoryIds)) {
            await shop.setSubCategories(subCategoryIds);
        }
        res.json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Shop (Protected)
app.delete('/api/shops/:id', authMiddleware, async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        await shop.destroy();
        res.json({ success: true, message: 'Shop deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Categories CRUD ---

// Get Categories (Public)
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create Category (Protected)
app.post('/api/categories', authMiddleware, async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Category (Protected)
app.put('/api/categories/:id', authMiddleware, async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        await category.update(req.body);
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Category (Protected)
app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        await category.destroy();
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- SubCategories CRUD ---

// Get SubCategories (Public)
app.get('/api/subcategories', async (req, res) => {
    try {
        // Can optionally filter subcategories by CategoryId: ?categoryId=1
        const { categoryId } = req.query;
        const whereClause = categoryId ? { CategoryId: categoryId } : {};
        
        const subcategories = await SubCategory.findAll({ where: whereClause });
        res.json({ success: true, data: subcategories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create SubCategory (Protected)
app.post('/api/subcategories', authMiddleware, async (req, res) => {
    try {
        const subCat = await SubCategory.create(req.body);
        res.json({ success: true, data: subCat });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update SubCategory (Protected)
app.put('/api/subcategories/:id', authMiddleware, async (req, res) => {
    try {
        const subCat = await SubCategory.findByPk(req.params.id);
        if (!subCat) return res.status(404).json({ success: false, message: 'SubCategory not found' });
        await subCat.update(req.body);
        res.json({ success: true, data: subCat });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete SubCategory (Protected)
app.delete('/api/subcategories/:id', authMiddleware, async (req, res) => {
    try {
        const subCat = await SubCategory.findByPk(req.params.id);
        if (!subCat) return res.status(404).json({ success: false, message: 'SubCategory not found' });
        await subCat.destroy();
        res.json({ success: true, message: 'SubCategory deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Serve the Admin Panel (SPA-like fallback)
// For any unhandled route, serve index.html
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

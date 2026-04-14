require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./models');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subCategoryRoutes = require('./routes/subCategoryRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Increase body parser limits for large Base64 payloads
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// SSR Open Graph Interceptor for Telegram/WhatsApp previews
app.get('/shops.html', async (req, res, next) => {
    const shopId = req.query.shop;
    if (!shopId) return next(); // Pass down to static server if not a specific shop share

    try {
        const { Shop, Category } = require('./models');
        const shop = await Shop.findByPk(shopId, { include: [{ model: Category }] });

        if (!shop) return next();

        let html = fs.readFileSync(path.join(__dirname, '../frontend/shops.html'), 'utf-8');
        
        const catName = shop.Category ? (shop.Category.name_ru || shop.Category.name) : '';
        const titleStr = catName ? `${catName} - ${shop.name}` : shop.name;
        const safeTitle = (titleStr || 'Ho.uz').replace(/"/g, '&quot;');
        
        const rawDesc = shop.description_ru || shop.description || "Ho.uz katalogidan do'kon sahifasini ko'ring.";
        const safeDesc = rawDesc.substring(0, 160).replace(/"/g, '&quot;');
        const safeImage = 'https://topin.uz/img/og_logo.png';
        const url = `https://topin.uz/shops.html?category=${req.query.category || 'all'}&shop=${shopId}`;

        const ogTags = `
    <!-- Dynamic Open Graph Data -->
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="website">
    
    <!-- Dynamic Twitter Card Data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${safeImage}">
        `;

        // Inject into <head>
        html = html.replace('</head>', `${ogTags}\n</head>`);
        html = html.replace(/<title>.*<\/title>/, `<title>${safeTitle} | Ho.uz</title>`);

        return res.send(html);
    } catch (err) {
        console.error('OG Tag Injection Error:', err);
        return next();
    }
});

app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files from 'frontend' directory

// Database Initialization
initDb();

// API Routes
app.get('/api/run-migration', async (req, res) => {
    try {
        const { SubCategory } = require('./models');
        
        // Final layout & fixes with precise ordering based on user's Excel sheet
        const orderList = [
            // Furniture
            'soft-furniture', 'cabinet-furniture', 'kitchen-furniture', 'bedroom-furniture', 'outdoor-furniture', 'tables',
            // Lighting
            'ceiling-lighting', 'wall-lighting', 'floor-lighting', 'street-lighting', 'tech-lighting',
            // Art & Decor
            'wall-decor', 'sculptures', 'textile', 'accessories',
            // Walls
            'paint', 'wallpaper', 'panels', 'wall-tiles',
            // Floor
            'wood-floor', 'laminate', 'floor-tiles', 'carpet',
            // Stone
            'natural-stone', 'artificial-stone', 'format',
            // Real Estate / Exterior
            'facade', 'roofing', 'landscape', 'pools', 'fences', 'facade-lights',
            // Plants
            'artificial-plants',
            // Bathroom
            'plumbing', 'shower', 'faucets', 'bathroom-furniture',
            // Other
            'furniture-fittings', 'smart-home', 'acoustics'
        ];

        // Ensure legacy fixes are still applied just in case they haven't run it yet
        const legacyFixes = {
            'soft-furniture': { nameRu: 'Мягкая мебель' },
            'cabinet-furniture': { nameRu: 'Корпусная мебель' },
            'outdoor-furniture': { nameRu: 'Уличная мебель' }, 
            'roofing': { nameRu: 'Кровля и водостоки' },
            'fences': { nameRu: 'Заборы и автоматические ворота' },
            'facade-lights': { nameRu: 'Архитектурная подсветка фасада' },
            'pools': { nameRu: 'Бассейны и водные зоны' },
            'furniture-fittings': { nameRu: 'Фурнитура' }
        };

        const allSubs = await SubCategory.findAll();
        let updated = 0;

        for (const sub of allSubs) {
            let fieldsToUpdate = {};
            
            // Reapply translation fix if needed
            if (legacyFixes[sub.slug] && !sub.name_ru) {
                fieldsToUpdate.name_ru = legacyFixes[sub.slug].nameRu;
            }

            // Map order index exactly as listed above. 
            // If it's not in the list, push it to the end (99)
            const targetOrder = orderList.indexOf(sub.slug) !== -1 ? orderList.indexOf(sub.slug) : 99;
            
            if (sub.order !== targetOrder || Object.keys(fieldsToUpdate).length > 0) {
                fieldsToUpdate.order = targetOrder;
                await sub.update(fieldsToUpdate);
                updated++;
            }
        }

        // Clean duplicates
        const duplicatesToRemove = ['bog-mebeli', 'krovkya-va-vodostoki', 'basseynlar', 'zaborlar-va-avtomatik-darvozalar'];
        for (const dupSlug of duplicatesToRemove) {
            const dup = allSubs.find(s => s.slug === dupSlug);
            if (dup) {
                try { await dup.destroy(); } catch(e) {}
            }
        }

        res.json({ success: true, message: `Perfect ordering applied! Updated layout order for ${updated} subcategories.` });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.use('/api', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);

// Fallback to index.html for undefined routes (SPA behavior support)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

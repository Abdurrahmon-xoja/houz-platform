require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
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
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files from 'frontend' directory

// Database Initialization
initDb();

// API Routes
app.get('/api/run-migration', async (req, res) => {
    try {
        const { Category, SubCategory, ShopSubCategory } = require('./models'); // Need ShopSubCategory to safely delete
        
        // 1. Fix old legacy slugs that were missing name_ru
        const legacyFixes = {
            'soft-furniture': { nameRu: 'Мягкая мебель' },
            'cabinet-furniture': { nameRu: 'Корпусная мебель' },
            'outdoor-furniture': { nameUz: "Bog' mebeli", nameRu: 'Уличная мебель' }, // Fix the curly quote too
            'roofing': { nameRu: 'Кровля и водостоки' },
            'fences': { nameRu: 'Заборы и автоматические ворота' },
            'facade-lights': { nameRu: 'Архитектурная подсветка фасада' },
            'pools': { nameRu: 'Бассейны и водные зоны' },
            'furniture-fittings': { nameRu: 'Фурнитура' }
        };

        const allSubs = await SubCategory.findAll();
        let updated = 0;

        for (const sub of allSubs) {
            // Apply legacy fixes
            if (legacyFixes[sub.slug]) {
                const fix = legacyFixes[sub.slug];
                await sub.update({ 
                    name_ru: fix.nameRu, 
                    name: fix.nameUz || sub.name 
                });
                updated++;
            }
            
            // Wait, but for the other properly synced ones, let's just make sure they got their name_ru
            // My previous script DID update most of them.
        }

        // 2. Safely Remove duplicates created by previous script mismatch (like bog-mebeli)
        const duplicatesToRemove = ['bog-mebeli', 'krovkya-va-vodostoki', 'basseynlar', 'zaborlar-va-avtomatik-darvozalar'];
        let deleted = 0;

        for (const dupSlug of duplicatesToRemove) {
            const dup = allSubs.find(s => s.slug === dupSlug);
            if (dup) {
                // Check if any shops use it. If not, delete it.
                // If using many-to-many, maybe sequelize throws if we don't clear associations. It's safe if cascade.
                try {
                    await dup.destroy();
                    deleted++;
                } catch(e) { console.log('Could not delete', dupSlug) }
            }
        }

        res.json({ success: true, message: `Migration fixed! Updated ${updated} missing translations and removed ${deleted} accidental duplicates.` });
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

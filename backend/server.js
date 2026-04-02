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
        const { Category, SubCategory } = require('./models');
        const DATA = [
            { catSlug: 'furniture', nameUz: 'Mebellar',          nameRu: 'Мебель (общая)' },
            { catSlug: 'furniture', nameUz: 'Kreslolar',         nameRu: 'Кресла' },
            { catSlug: 'furniture', nameUz: 'Divonlar',          nameRu: 'Диваны' },
            { catSlug: 'furniture', nameUz: 'Oshxona mebeli',    nameRu: 'Куханная мебель' },
            { catSlug: 'furniture', nameUz: 'Yotoqxona',         nameRu: 'Спальня' },
            { catSlug: 'furniture', nameUz: "Bog' mebeli",       nameRu: 'Уличная мебель' },
            { catSlug: 'furniture', nameUz: 'Stollar',           nameRu: 'Столы' },
            { catSlug: 'lighting', nameUz: 'Shift chiroqlari',     nameRu: 'Потолочное освещение' },
            { catSlug: 'lighting', nameUz: 'Devor chiroqlari',     nameRu: 'Настенное' },
            { catSlug: 'lighting', nameUz: 'Pol va stol lampalari',nameRu: 'Напольное и настольное' },
            { catSlug: 'lighting', nameUz: 'Tashqi yoritish',      nameRu: 'Уличное освещение' },
            { catSlug: 'lighting', nameUz: 'Texnik yoritish',      nameRu: 'Техническое' },
            { catSlug: 'art-decor', nameUz: 'Devor dekori',    nameRu: 'Настенный декор' },
            { catSlug: 'art-decor', nameUz: 'Haykaltaroshlik', nameRu: 'Скульптуры и статуэтки' },
            { catSlug: 'art-decor', nameUz: "To'qimachilik",   nameRu: 'Текстиль' },
            { catSlug: 'art-decor', nameUz: 'Aksessuarlar',    nameRu: 'Аксессуары' },
            { catSlug: 'walls', nameUz: "Bo'yoqlar",    nameRu: 'Краска' },
            { catSlug: 'walls', nameUz: "Gulqog'ozlar", nameRu: 'Обои' },
            { catSlug: 'walls', nameUz: 'Panellar',     nameRu: 'Панели' },
            { catSlug: 'walls', nameUz: 'Kafel',        nameRu: 'Плитка' },
            { catSlug: 'floor', nameUz: "Yog'ochli qoplamalar", nameRu: 'Дерево' },
            { catSlug: 'floor', nameUz: 'Laminat va vinil',     nameRu: 'Ламинат и винил' },
            { catSlug: 'floor', nameUz: 'Kafel',                nameRu: 'Плитка' },
            { catSlug: 'floor', nameUz: 'Yumshoq qoplamalar',   nameRu: 'Ковровые покрытия' },
            { catSlug: 'stone', nameUz: 'Tabiiy tosh',  nameRu: 'Натуральный камень' },
            { catSlug: 'stone', nameUz: "Sun'iy tosh",  nameRu: 'Искусственный камень' },
            { catSlug: 'stone', nameUz: 'Format',        nameRu: 'Формат' },
            { catSlug: 'real-estate', nameUz: 'Fasad materiallari',             nameRu: 'Фасадные материалы' },
            { catSlug: 'real-estate', nameUz: 'Tom va suv oqizgichlar',         nameRu: 'Кровля и водостоки' },
            { catSlug: 'real-estate', nameUz: 'Landshaft',                      nameRu: 'Ландшафтный' },
            { catSlug: 'real-estate', nameUz: 'Basseynlar va suv zonalari',     nameRu: 'Бассейны и водные зоны' },
            { catSlug: 'real-estate', nameUz: 'Panjara va avtomatik darvozalar',nameRu: 'Заборы и автоматические ворота' },
            { catSlug: 'real-estate', nameUz: 'Fasad arxitektura yoritishi',    nameRu: 'Архитектурная подсветка фасада' },
            { catSlug: 'plants', nameUz: "Sun'iy o'simliklar", nameRu: 'Искусственные растения' },
            { catSlug: 'bathroom', nameUz: 'Santexnika',                 nameRu: 'Сантехника' },
            { catSlug: 'bathroom', nameUz: 'Dush',                       nameRu: 'Душ' },
            { catSlug: 'bathroom', nameUz: 'Smesitellar va aksessuarlar',nameRu: 'Смесители и аксессуары' },
            { catSlug: 'bathroom', nameUz: 'Vanna mebellari',            nameRu: 'Мебель для ванной' },
            { catSlug: 'other', nameUz: 'Furnituralar', nameRu: 'Фурнитура' },
            { catSlug: 'other', nameUz: 'Texnika',      nameRu: 'Техника и умный дом' },
            { catSlug: 'other', nameUz: 'Akustika',     nameRu: 'Акустика' },
        ];
        
        const allCats = await Category.findAll();
        const catMap = {};
        allCats.forEach(c => { catMap[c.slug] = c.id; });
        const allSubs = await SubCategory.findAll();
        let updated = 0, created = 0;
        
        for (const row of DATA) {
            const catId = catMap[row.catSlug];
            if (!catId) continue;
            let existing = allSubs.find(s =>
                String(s.CategoryId) === String(catId) &&
                ((s.name || '').toLowerCase().trim() === row.nameUz.toLowerCase().trim() ||
                 (s.name || '').toLowerCase().trim() === row.nameRu.toLowerCase().trim() ||
                 (s.name_ru || '').toLowerCase().trim() === row.nameRu.toLowerCase().trim())
            );
            
            if (existing) {
                await existing.update({ name: row.nameUz, name_ru: row.nameRu });
                updated++;
            } else {
                const slug = row.nameUz.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
                await SubCategory.create({ name: row.nameUz, name_ru: row.nameRu, slug, CategoryId: catId, order: 0 });
                created++;
            }
        }
        res.json({ success: true, message: `Migration completed successfully on Postgres DB! Updated: ${updated}, Created: ${created}` });
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

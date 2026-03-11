const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

const Shop = sequelize.define('Shop', {
    name: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING },
    locationLink: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    website: { type: DataTypes.STRING },
    instagram: { type: DataTypes.STRING },
    telegram: { type: DataTypes.STRING },
    logoUrl: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    description_ru: { type: DataTypes.TEXT },
    CategoryId: { type: DataTypes.INTEGER }
});

const ShopSubCategories = sequelize.define('ShopSubCategories', {
    ShopId: { type: DataTypes.INTEGER, primaryKey: true },
    SubCategoryId: { type: DataTypes.INTEGER, primaryKey: true }
}, { timestamps: false });

const shopsData = [
    {
        name: 'Kuka Home Mebel',
        location: 'Toshkent, Yunusobod',
        locationLink: 'https://maps.google.com/?q=Tashkent',
        phone: '+998 90 123 45 67',
        website: 'https://kuka.uz',
        instagram: 'https://instagram.com/kukahome',
        telegram: 'https://t.me/kukahome',
        logoUrl: '',
        description: 'Zamonaviy va klassik uslubdagi sifatli mebellar. Yotoqxona va mehmonxona uchun.',
        description_ru: 'Качественная мебель в современном и классическом стиле. Для спальни и гостиной.',
        CategoryId: 1,
        subcategories: [1, 4] // Yumshoq, Yotoqxona
    },
    {
        name: 'Shatura Mebel',
        location: 'Toshkent, Chilonzor',
        phone: '+998 99 333 44 55',
        website: 'https://shatura.uz',
        instagram: 'https://instagram.com/shatura.uz',
        logoUrl: '',
        description: 'Uyingiz uchun eng yaxshi mebel yechimlari, shkaflar va oshxona.',
        description_ru: 'Лучшие мебельные решения для вашего дома, шкафы и кухни.',
        CategoryId: 1,
        subcategories: [2, 3] // Korpusnaya, Oshxona
    },
    {
        name: 'Comfort Mebel',
        location: 'Toshkent, Mirzo Ulugbek',
        phone: '+998 90 987 65 43',
        description: 'Qulaylik va shinamlik — bir joyda. Ofis va uy uchun.',
        description_ru: 'Комфорт и уют в одном месте. Для офиса и дома.',
        CategoryId: 1,
        subcategories: [1, 6] // Yumshoq, Stollar
    },
    {
        name: 'Royal Light',
        location: 'Samarqand',
        phone: '+998 93 111 22 33',
        description: 'Katta assortimentdagi qandillar, bralar va yoritish uskunalari.',
        description_ru: 'Большой ассортимент люстр, бра и осветительных приборов.',
        CategoryId: 2,
        subcategories: [7, 8] // Shift chiroqlari, Devor chiroqlari
    },
    {
        name: 'Chiroq.uz',
        location: 'Toshkent, Qatortol',
        website: 'https://chiroq.uz',
        description: 'Eksklyuziv pol va stol lampalari keng tanlovi.',
        description_ru: 'Широкий выбор эксклюзивных торшеров и настольных ламп.',
        CategoryId: 2,
        subcategories: [9, 10] // Pol va stol lampalari, Tashqi
    },
    {
        name: 'Decor Gallery',
        location: 'Toshkent, Markaz-1',
        instagram: 'https://instagram.com/decor.gallery',
        description: 'Noyob san\'at asarlari, devor dekori va uyingiz uchun aksessuarlar.',
        description_ru: 'Уникальные предметы искусства, декор для стен и аксессуары для дома.',
        CategoryId: 3,
        subcategories: [12, 13, 15] // Devor dekori, Haykaltaroshlik, Aksessuarlar
    },
    {
        name: 'Ideal House Wallpapers',
        location: 'Toshkent, Mirobod',
        phone: '+998 71 200 44 55',
        description: 'Rossiya va Yevropadan keltirilgan eng sifatli gulqog\'ozlar va bo\'yoqlar.',
        description_ru: 'Качественные обои и краски из России и Европы.',
        CategoryId: 4,
        subcategories: [16, 17] // Bo'yoqlar, Gulqog'ozlar
    },
    {
        name: 'Tarkett Uzbekistan',
        location: 'Toshkent, Sergeli',
        website: 'https://tarkett.uz',
        description: 'Yuqori sifatli laminat, linoleum va vinil qoplamalari.',
        description_ru: 'Высококачественный ламинат, линолеум и виниловые покрытия.',
        CategoryId: 5,
        subcategories: [21, 23] // Laminat va vinil, Yumshoq 
    },
    {
        name: 'Kafel.uz',
        location: 'Toshkent, Jomiy bozori',
        description: 'Ispaniya, Turkiya va Xitoydan yuqori sifatli kafel va keramogranit.',
        description_ru: 'Высококачественный кафель и керамогранит из Испании, Турции и Китая.',
        CategoryId: 4,
        subcategories: [19] // Kafel (Walls)
    },
    {
        name: 'Stone Design',
        location: 'Surxondaryo, Termiz',
        description: 'Tabiiy va sun\'iy toshdan yasalgan stol usti va fasad panellar.',
        description_ru: 'Столешницы и фасадные панели из натурального и искусственного камня.',
        CategoryId: 6,
        subcategories: [24, 25] // Tabiiy tosh, Sun'iy tosh
    },
    {
        name: 'Grohe Tashkent',
        location: 'Toshkent, Shayxontohur',
        website: 'https://grohe.uz',
        description: 'Germaniya sifatiga ega premium santexnika va aksessuarlar.',
        description_ru: 'Премиальная сантехника и аксессуары немецкого качества.',
        CategoryId: 9,
        subcategories: [34, 35, 36] // Santexnika, Dush, Smesitellar
    },
    {
        name: 'Green Art Plants',
        location: 'Toshkent, Olmazor',
        instagram: 'https://instagram.com/greenart.uz',
        description: 'Interyer va eksteryer uchun ajoyib sun\'iy o\'simliklar.',
        description_ru: 'Потрясающие искусственные растения для интерьера и экстерьера.',
        CategoryId: 8,
        subcategories: [33] // Sun'iy o'simliklar
    },
    {
        name: 'AKFA Build',
        location: 'Toshkent, Yashnobod',
        website: 'https://akfabuild.uz',
        description: 'Fasad materiallari, sendvich panellar va zamonaviy darchalar.',
        description_ru: 'Фасадные материалы, сэндвич-панели и современные ворота.',
        CategoryId: 7,
        subcategories: [27, 31] // Fasad, Zaborlar
    }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to db.');

        // Clear existing shops
        await Shop.destroy({ where: {} });
        await ShopSubCategories.destroy({ where: {} });
        console.log('Cleared old shops.');

        for (const shop of shopsData) {
            const { subcategories, ...shopRecord } = shop;
            const createdShop = await Shop.create(shopRecord);
            
            if (subcategories && subcategories.length > 0) {
                const mapData = subcategories.map(subId => ({
                    ShopId: createdShop.id,
                    SubCategoryId: subId
                }));
                await ShopSubCategories.bulkCreate(mapData);
            }
        }
        
        console.log(`Successfully seeded ${shopsData.length} shops!`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seed();

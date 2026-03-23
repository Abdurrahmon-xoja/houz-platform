const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

// Import modular definitions
const User = require('./User')(sequelize, DataTypes);
const Shop = require('./Shop')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const SubCategory = require('./SubCategory')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);

// Associations
Shop.hasMany(Product);
Product.belongsTo(Shop);

Category.hasMany(Product);
Product.belongsTo(Category);

Category.hasMany(Shop);
Shop.belongsTo(Category);

Category.hasMany(SubCategory);
SubCategory.belongsTo(Category);

SubCategory.belongsToMany(Shop, { through: 'ShopSubCategories' });
Shop.belongsToMany(SubCategory, { through: 'ShopSubCategories' });

// Database Initialization function
const initDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        if (sequelize.getDialect() === 'sqlite') {
            await sequelize.query('PRAGMA foreign_keys = false;');
            await sequelize.sync(); 
            
            try { await sequelize.query("ALTER TABLE Shops ADD COLUMN socialPlatform VARCHAR(255);"); } catch (e) {}
            try { await sequelize.query("ALTER TABLE Shops ADD COLUMN socialUrl VARCHAR(255);"); } catch (e) {}
            try { await sequelize.query("ALTER TABLE Shops ADD COLUMN customLinks TEXT;"); } catch (e) {}
            try { await sequelize.query("ALTER TABLE SubCategories ADD COLUMN \"order\" INTEGER DEFAULT 0;"); } catch (e) {}

            await sequelize.query('PRAGMA foreign_keys = true;');
        } else {
            // PostgreSQL handles alter: true safely and natively
            await sequelize.sync({ alter: true });
        }
        
        console.log('Database synced.');
        
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (!admin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({ username: 'admin', password: hashedPassword });
            console.log('Default admin user created.');
        } else if (admin.password.length < 60) {
            console.log('Updating legacy plaintext admin password to bcrypt hash...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            admin.password = hashedPassword;
            await admin.save();
            console.log('Admin password updated.');
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Shop,
    Category,
    SubCategory,
    Product,
    initDb
};

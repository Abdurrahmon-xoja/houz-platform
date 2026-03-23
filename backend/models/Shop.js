module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Shop', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        customLinks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        socialPlatform: {
            type: DataTypes.STRING,
            allowNull: true
        },
        socialUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT
        },
        description_ru: {
            type: DataTypes.TEXT
        },
        location: {
            type: DataTypes.STRING
        },
        locationLink: {
            type: DataTypes.STRING
        },
        website: {
            type: DataTypes.STRING
        },
        instagram: {
            type: DataTypes.STRING
        },
        telegram: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        logoUrl: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });
};

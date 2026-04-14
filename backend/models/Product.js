module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Product', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        price: {
            type: DataTypes.DECIMAL(10, 2)
        },
        imageUrl: {
            type: DataTypes.TEXT
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });
};

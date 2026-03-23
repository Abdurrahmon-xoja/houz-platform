module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SubCategory', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });
};

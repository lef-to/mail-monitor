'use strict';

module.exports = (sequelize, DataTypes) => {
    const Admin = sequelize.define('admins', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        pass: DataTypes.STRING,
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    },
    {
        timestamps: true,
        underscored: true,
        paranoid: true
    })
    Admin.associate = function(models) {

    };
    return Admin
}

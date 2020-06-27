'use strict';

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('users', {
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
    }, {
        timestamps: true,
        underscored: true,
        paranoid: true,
        // getterMethods: {
        //     comparePass(value) {
        //         return this.pass == value;
        //     }
        // },
        // setterMethods: {
        //     pass(value) {
        //         this.setDataValue('pass', pass2hash(value));
        //     }
        // }
    })
    User.associate = function(models) {

        User.belongsToMany(models.mailboxes, {
            through: models.rel_user_boxes,
            foreignKey: 'user_id',
            otherKey: 'mailbox_id',
            as: 'userboxes'
        });

    };
    return User
}

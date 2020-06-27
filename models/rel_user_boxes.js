'use strict';
module.exports = (sequelize, DataTypes) => {
  const RelUserBox = sequelize.define('rel_user_boxes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: DataTypes.INTEGER,
    mailbox_id: DataTypes.INTEGER,
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  }, {
    timestamps: true,
    underscored: true,
  });
  RelUserBox.associate = function(models) {
    RelUserBox.hasMany(models.mailboxes, {
      foreignKey: 'id',
      sourceKey: 'user_id',
      as: 'boxes'
    });
  };
  return RelUserBox;
};

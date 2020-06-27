'use strict';
module.exports = (sequelize, DataTypes) => {
  const Mailbox = sequelize.define('mailboxes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: DataTypes.STRING,
    name: DataTypes.STRING,
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
    },
  }, {
    underscored: true,
    timestamps: true,
  });

  Mailbox.associate = function(models) {

    // Mailbox.belongsToMany(models.users, {
    //   through: models.rel_user_boxes,
    //   foreignKey: 'mailbox_id',
    //   otherKey: 'user_id',
    //   as: 'boxesuser'
    // });
  };
  return Mailbox;
};

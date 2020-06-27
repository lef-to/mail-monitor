'use strict';

const crypto = require('crypto');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('admins', [{
      name: 'admin',
      email: 'admin@admin.jp',
      pass: crypto.createHash('sha256').update('hogehoge').digest('hex'),
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('admins', null, {});
  }
};

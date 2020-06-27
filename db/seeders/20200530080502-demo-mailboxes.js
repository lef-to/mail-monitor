'use strict';

const crypto = require('crypto');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('mailboxes', [{
      title: '郵便箱１',
      name: 'abcdefghijklm1',
      pass: crypto.createHash('sha256').update('ABCDEFGHIJKLM1').digest('hex'),
      created_at: new Date(),
      updated_at: new Date()
    },{
      title: '郵便箱２',
      name: 'abcdefghijklm2',
      pass: crypto.createHash('sha256').update('ABCDEFGHIJKLM2').digest('hex'),
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('mailboxes', null, {});
  }
};

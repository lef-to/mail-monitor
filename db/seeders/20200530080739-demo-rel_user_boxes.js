'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('rel_user_boxes', [{
      user_id: 1,
      mailbox_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      user_id: 1,
      mailbox_id: 2,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('rel_user_boxes', null, {});
  }
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 *
 */
define(function (require, exports, module) {
  'use strict';

  const Backbone = require('backbone');
  const SecurityEvent = require('models/security-event');

  var SecurityHistory = Backbone.Collection.extend({
    model: function(attrs, options) {
      return new SecurityEvent(attrs, options);
    },

    fetchHistory (clientTypes = {}, user) {
      var account = user.getSignedInAccount();

      return user.fetchSecurityHistory(account)
        .then((events) => {
          this.reset();

          events = events.sort(this.comparator);

          if (events) {
            events.forEach((item) => {

              // Set a more friendly name for event name
              if (item.name === 'account.login') {
                item.name = 'Account logged in';
              } else if (item.name === 'account.reset') {
                item.name = 'Account password reset';
              } else if (item.name === 'account.create') {
                item.name = 'Account created';
              }

              this.add(item);
            });
          }
        });
    },

    comparator (a, b) {
      if (a.createdAt > b.createdAt) {
        return -1;
      } else if (a.createdAt < b.createdAt) {
        return 1;
      } else {
        return 0;
      }
    }

  });

  module.exports = SecurityHistory;
});

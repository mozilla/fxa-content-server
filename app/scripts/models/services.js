/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A collection of services
 */


define(function (require, exports, module) {
  'use strict';

  module.exports = require('backbone').Collection.extend({
    model: require('models/service'),

    initialize: function (models, options) {
      options = options || {};
    }
  });
});



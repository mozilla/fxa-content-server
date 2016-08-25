/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A collection of OAuth apps
 */
define(function (require, exports, module) {
  'use strict';
  var Backbone = require('backbone');
  var App = require('models/app');

  module.exports = Backbone.Collection.extend({
    model: App,

    initialize: function (models, options = {}) {
    }
  });
});



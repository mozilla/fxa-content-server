/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A collection of devices
 */


define(function (require, exports, module) {
  'use strict';

  var Backbone = require('backbone');
  var Device = require('models/device');

  var Devices = Backbone.Collection.extend({
    model: Device,

    initialize: function (models, options) {
      options = options || {};
    }

  });

  module.exports = Devices;
});



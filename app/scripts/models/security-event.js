/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * SecurityEvent information
 */

define(function (require, exports, module) {
  'use strict';

  const Backbone = require('backbone');

  // Hard coding os and location for now
  var SecurityEvent = Backbone.Model.extend({
    defaults: {
      createdAt: null,
      createdAtTimeFormatted: null,
      location: 'Kona, Hawaii, USA',
      name: null,
      os: 'Firefox 56',
      userAgent: null,
      verified: null
    }
  });

  module.exports = SecurityEvent;
});


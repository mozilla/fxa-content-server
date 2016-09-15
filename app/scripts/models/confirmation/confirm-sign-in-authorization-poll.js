/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Backbone = require('backbone');
  const Constants = require('lib/constants');

  const Model = Backbone.Model.extend({
    initialize (attributes, options = {}) {
      this._pollIntervalInMS =
        options.pollIntervalInMS || Constants.VERIFICATION_POLL_IN_MS;
    },

    start () {
    },

    stop () {
    }
  });

  module.exports = Model;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// A channel that uses the URL to pass around information.

define([
  'underscore',
  'backbone'
], function (_, Backbone) {
  'use strict';

  function WebChannel() {
  }

  _.extend(WebChannel.prototype, Backbone.Events, {
    init: function (options) {
      options = options || {};

      this._window = options.window;
    },

    teardown: function () {
    },

    send: function (command, data, done) {
      if (done) {
        done();
      }
    },

    completeOAuth: function (result) {
      this._window.location.href = result.redirect;
    }
  });

  return WebChannel;
});

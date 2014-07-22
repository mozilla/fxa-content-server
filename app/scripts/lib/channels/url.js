/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// A channel that uses the URL to pass around information.

define([
  'underscore',
  'backbone'
], function (_, Backbone) {
  'use strict';

  function UrlChannel() {
  }

  _.extend(UrlChannel.prototype, Backbone.Events, {
    init: function (options) {
      options = options || {};

      this._window = options.window || window;
    },

    teardown: function () {
    },

    send: function (command, data, done) {
      if (done) {
        done();
      }
    },

    completeOAuth: function (result, source) {
      this._window.location.href = result.redirect;
    },

    completeOAuthError: function (result) {
      this._window.location.href = result.redirect +
                                  '?error=' + encodeURIComponent(result.error);
    }
  });

  return UrlChannel;
});

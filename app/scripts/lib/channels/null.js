/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// A shell of for a channel. Doesn't do anything yet, but is a useful standin.

define([
  'underscore',
  'backbone'
], function (_, Backbone) {
  'use strict';


  function NullChannel() {
  }

  _.extend(NullChannel.prototype, Backbone.Events, {
    init: function () {
    },

    teardown: function () {
    },

    send: function (command, data, done) {
      if (done) {
        done();
      }
    },

    completeOAuth: function (result) {
    }
  });

  return NullChannel;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// A shell of a web channel. Doesn't do anything yet, but is a useful standin.

define([
    'underscore',
    'backbone',
    'lib/channels/helpers'
],
function (_, Backbone, ChannelHelpers) {

  function WebChannel() {
    // nothing to do.
  }

  _.extend(WebChannel.prototype, Backbone.Events, {
    init: function init(options) {
      options = options || {};

      this.window = options.window || window;

    },
    send: function (command, data, done) {
      done = done || ChannelHelpers.noOp;

      try {
        // Browsers can blow up dispatching the event.
        // Ignore the blowups and return without retrying.
        var event = ChannelHelpers.createEvent.call(this, command, data);
        this.window.dispatchEvent(event);
      } catch (e) {
        return done(e);
      }
      done();
    }
  });

  return WebChannel;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// A web channel to send Custom Events.

define(function () {
  function WebChannel(name, context) {
    this.name = name || 'WebChannelMessage';
    this.window = context || window;
  }

  WebChannel.prototype = {
    init: function () {
    },
    teardown: function () {
    },
    send: function (command, data, done) {
      done = done || noOp;

      try {
        // Browsers can blow up dispatching the event.
        // Ignore the blowups and return without retrying.
        var event = this.event(command, data);
        this.window.dispatchEvent(event);
      } catch (e) {
        return done(e);
      }
      return done();
    },
    event: function(command, data) {
      return new this.window.CustomEvent(this.name, {
        detail: {
          command: command,
          data: data,
          bubbles: true
        }
      });
    }
  };

  function noOp() {
  }

  return WebChannel;
});


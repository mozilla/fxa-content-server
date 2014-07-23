/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// Firefox for desktop native=>FxA glue code.

define([
  'underscore',
  'lib/channels/postmessage_receiver'
],
function (_, PostMessageReceiverChannel) {
  var SENDABLE_COMMANDS = [
    'session_status',
    'can_link_account',
    'login'
  ];

  function createEvent(command, data) {
    /*jshint validthis: true*/
    return new this._window.CustomEvent('FirefoxAccountsCommand', {
      detail: {
        command: command,
        data: data,
        bubbles: true
      }
    });
  }

  function Channel() {
    // nothing to do here.
  }

  var _super = new PostMessageReceiverChannel();
  _.extend(Channel.prototype, _super, {
    shouldAcceptMessage: function (event) {
      // all messages are trusted in this context.
      return true;
    },

    parseMessage: function (message) {
      /*jshint validthis: true*/
      var type = message.type;
      var result = message.content;

      if (! (type === 'message' && result)) {
        return;
      }

      return {
        command: result.status,
        data: result
      };
    },

    isCommandSendable: function (command) {
      return _.indexOf(SENDABLE_COMMANDS, command) > -1;
    },

    dispatchCommand: function (command, data) {
      var event = createEvent.call(this, command, data);
      this._window.dispatchEvent(event);
    }
  });

  return Channel;

});


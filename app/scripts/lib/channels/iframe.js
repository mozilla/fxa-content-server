/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * A channel that takes care of the IFRAME'd OAuth flow.
 *
 * Only RPs that are whitelisted are allowed to use
 * the IFRAME'd oauth flow.
 *
 * When the channel is initialized, it sends a `ping` message
 * to the parent window. The parent window should respond with
 * a `ping` message. The response event contains a trusted `origin`
 * for the parent window. Using the `origin` from the event is
 * safer than relying on the `referrer` header since headers can be
 * faked.
 *
 * When the `ping` response is received, the origin of the message is
 * checked against a whitelist on the server. If the parent's origin
 * is not on the list, the ILLEGAL_IFRAME_PARENT error is thrown.
 */

define([
  'underscore',
  'jquery',
  'lib/auth-errors',
  'lib/channels/postmessage_receiver',
  'lib/promise'
], function (_, $, AuthErrors, PostMessageReceiverChannel, p) {
  var SENDABLE_COMMANDS = [
    'ping',
    'oauth_complete',
    'oauth_cancel'
  ];

  function noOp() {
    // it's a noOp, nothing to do.
  }

  function getParentOrigin() {
    /*jshint validthis: true*/
    var deferred = p.defer();

    this.send('ping', {}, function (err, data, event) {
      if (err) {
        return deferred.reject(err);
      }
      deferred.resolve(event.origin);
    });

    return deferred.promise;
  }

  function isOriginAllowedToUseIframe() {
    /*jshint validthis: true*/
    return getParentOrigin.call(this)
        .then(function (parentOrigin) {
          return p.jQueryXHR($.getJSON('/iframe_allowed/' + encodeURIComponent(parentOrigin)));
        }).then(function (result) {
          return result.isIframeAllowed;
        });
  }

  function IframeChannel() {
    // constructor, nothing to do.
  }

  var _super = new PostMessageReceiverChannel();
  _.extend(IframeChannel.prototype, _super, {
    shouldAcceptMessage: function (event) {
      // TODO - do we want to check event.origin here too?
      return true;
    },

    parseMessage: function (message) {
      var components = message.split('!!!');
      return {
        command: components[0],
        data: JSON.parse(components[1] || '{}')
      };
    },

    isCommandSendable: function (command) {
      return _.indexOf(SENDABLE_COMMANDS, command) > -1;
    },

    dispatchCommand: function (command, data) {
      var msg = command + '!!!' + JSON.stringify(data|| {});
      this._window.parent.postMessage(msg, '*');
    },

    send: function (command, data, done) {
      /*jshint camelcase: false*/
      done = done || noOp;

      if (command === 'check_environment') {
        return isOriginAllowedToUseIframe.call(this)
            .then(function (isAllowed) {
              if (! isAllowed) {
                return done(AuthErrors.toError('ILLEGAL_IFRAME_PARENT'));
              }

              done(null);
            }, done);
      }

      return _super.send.call(this, command, data, done);
    }
  });

  return IframeChannel;
});


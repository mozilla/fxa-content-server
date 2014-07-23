/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// A web channel to send Custom Events via a Firefox WebChannel
// https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/WebChannel.jsm

define([
  'underscore',
  'backbone',
  'lib/promise',
  'lib/url'
], function (_, Backbone, p, Url) {
  'use strict';

  function FirefoxWebChannel() {
    // nothing to do here.
  }

  _.extend(FirefoxWebChannel.prototype, Backbone.Events, {
    completeOAuthNoInteraction: true,

    init: function (options) {
      options = options || {};

      this._webChannelId = options.webChannelId || 'message';
      this._window = options.window || window;
      this._messageCallbacks = [];
      this._messageListenerAttached = false;
    },

    /**
     * Teardown function for the FirefoxWebChannel
     */
    teardown: function () {
      this._window.removeEventListener('WebChannelMessageToContent', this._messageListener);
      this._messageCallbacks = [];
      this._messageListenerAttached = false;
    },

    /**
     * Send Custom Event on 'this._window'
     * @param {Object} message
     *        Message
     * @param {Object} data
     *        Data
     * @param {Function} [done]
     *        Callback function
     */
    send: function (message, data, done) {
      done = done || noOp;

      try {
        // Browsers can blow up dispatching the event.
        // Ignore the blowups and return without retrying.
        this._window.dispatchEvent(this.event(message));
      } catch (e) {
        return done(e);
      }
      return done();
    },

    /**
     * Subscribe to listen on events
     *
     * @param {String} name
     *        Event name
     * @param {Function} callback
     *        Callback for the event
     */
    on: function (name, callback) {
      if (name && callback && name === 'message') {
        // only add one message listener
        if (!this._messageListenerAttached) {
          this._messageListenerAttached = true;
          this._window.addEventListener('WebChannelMessageToContent', this._messageListener.bind(this), true);
        }
        this._messageCallbacks.push(callback);
      }
    },

    /**
     * Custom event to send custom events named 'WebChannelMessageToChrome'
     *
     * @param {Object} [message]
     *        Message object
     * @returns {CustomEvent}
     */
    event: function (message) {
      return new this._window.CustomEvent('WebChannelMessageToChrome', {
        detail: {
          webChannelId: this._webChannelId,
          message: message ? message : {}
        }
      });
    },

    /**
     * Event handler for 'WebChannelMessageToContent' events
     *
     * @param {Event} e
     * @private
     */
    _messageListener: function (e) {
      var data = e.detail;

      if (data.webChannelId === this._webChannelId && data.message) {
        this._messageCallbacks.forEach(function(callback) {
          callback(data.webChannelId, data.message);
        });
      }
    },

    _getRedirectParam: function(redirect, name) {
      var redirectParams = redirect && redirect.split('?')[1];

      return redirectParams && Url.searchParam(name, redirectParams);
    },

    completeOAuth: function (result, source) {
      var self = this;

      var defer = p.defer();

      var state = self._getRedirectParam(result.redirect, 'state');
      var code = self._getRedirectParam(result.redirect, 'code');

      this.send({
        command: 'oauth_complete',
        state: state,
        code: code,
        closeWindow: source === 'signin'
      });

      this.on('message', function (webChannelId, message) {
        if (message.error) {
          defer.reject(message.error);
        }
      });

      return defer.promise;
    },

    completeOAuthError: function (result) {
      // TODO - what do we do here?
    }
  });

  function noOp() {
  }

  return FirefoxWebChannel;
});


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A broker that makes use of the WebChannel abstraction to communicate
 * with the browser
 */

'use strict';

define([
  'underscore',
  'models/brokers/oauth',
  'models/brokers/mixins/channel',
  'lib/channels/web',
  'lib/oauth-errors'
], function (_, OAuthBroker, ChannelMixin, WebChannel, OAuthErrors) {

  var EXPECT_CHANNEL_RESPONSE_TIMEOUT = 5000;

  var WebChannelBroker = OAuthBroker.extend({
    defaults: _.extend({}, OAuthBroker.prototype.defaults, {
      webChannelId: null
    }),

    initialize: function (options) {
      options = options || {};

      // channel can be passed in for testing.
      this._channel = options.channel;

      return OAuthBroker.prototype.initialize.call(this, options);
    },

    fetch: function () {
      var self = this;
      return OAuthBroker.prototype.fetch.call(this)
        .then(function () {
          if (self._isVerificationFlow()) {
            self._setupVerificationFlow();
          } else {
            self._setupSigninSignupFlow();
          }
        });
    },

    finishOAuthFlow: function (result, source) {
      result.closeWindow = (source === 'signin');
      return this.send('oauth_complete', result);
    },

    afterSignIn: function (view) {
      return OAuthBroker.prototype.afterSignIn.call(this, view)
        .then(function () {
          // expect the window to be closed after sign in (see
          // finishOAuthFlow). Show an error message if the window is
          // still open after the timeout expires.
          view.setTimeout(function () {
            view.displayError(OAuthErrors.toError('TRY_AGAIN'));
          }, EXPECT_CHANNEL_RESPONSE_TIMEOUT);
        });
    },

    _isVerificationFlow: function () {
      return !! this.getSearchParam('code');
    },

    _setupSigninSignupFlow: function () {
      this.importSearchParam('webChannelId');
    },

    _setupVerificationFlow: function () {
      var resumeObj = this.session.oauth;

      if (! resumeObj) {
        // user is verifying in a second browser. The browser is not
        // listening for messages.
        return;
      }

      this.set('webChannelId', resumeObj.webChannelId);
    },

    /**
     * The web channel should auto-submit on the ready screen.
     */
    shouldReadyScreenAutoSubmit: function () {
      return true;
    },

    // used by the ChannelMixin to get a channel.
    getChannel: function () {
      if (this._channel) {
        return this._channel;
      }

      var channel = new WebChannel(this.get('webChannelId'));
      channel.init({
        window: this.window
      });

      return channel;
    }
  });

  _.extend(WebChannelBroker.prototype, ChannelMixin);
  return WebChannelBroker;
});

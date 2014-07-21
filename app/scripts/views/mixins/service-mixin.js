/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// helper functions for views with passwords. Meant to be mixed into views.

'use strict';

define([
  'p-promise',
  'views/base',
  'lib/url',
  'lib/oauth-client',
  'lib/assertion',
  'lib/oauth-errors',
  'lib/config-loader',
  'lib/session',
  'lib/service-name',
  'lib/channels/factory'
], function (p, BaseView, Url, OAuthClient, Assertion, OAuthErrors, ConfigLoader, Session, ServiceName, channelFactory) {
  /* jshint camelcase: false */

  // If the user completes an OAuth flow using a different browser than they started with, we
  // redirect them back to the RP with this code in the `error_code` query param.
  var RP_DIFFERENT_BROWSER_ERROR_CODE = 3005;

  var SYNC_SERVICE = 'sync';

  return {
    setupOAuth: function (params) {
      if (!this._configLoader) {
        this._configLoader = new ConfigLoader();
      }

      this._oAuthClient = new OAuthClient();

      if (! params) {
        // params listed in:
        // https://github.com/mozilla/fxa-oauth-server/blob/master/docs/api.md#post-v1authorization
        params = Url.searchParams(this.window.location.search,
                  ['client_id', 'redirect_uri', 'state', 'scope', 'action']);
      }
      this._oAuthParams = params;

      // FxA auth server API expects a 'service' parameter to include in
      // verification emails. Oauth uses 'client_id', so we set 'service'
      // to the 'client_id'.
      this.service = params.client_id || Session.service;
      Session.set('service', this.service);

      this._channel = this._createChannel();
    },

    setServiceInfo: function () {
      var self = this;

      if (this.service === SYNC_SERVICE) {
        self.serviceName = new ServiceName(this.translator).get(this.service);
        return p();
      }

      return this._oAuthClient.getClientInfo(this.service)
        .then(function(clientInfo) {
          self.serviceName = clientInfo.name;
          self.serviceRedirectURI = clientInfo.redirect_uri;
        })
        .fail(function(err) {
          self.error = OAuthErrors.toMessage(err);
        });
    },

    oAuthRedirectWithError: function () {
      this.window.location.href = this.serviceRedirectURI +
                                  '?error=' + RP_DIFFERENT_BROWSER_ERROR_CODE;
    },

    finishOAuthFlow: function (options) {
      options = options || {};
      var self = this;

      return this._configLoader.fetch().then(function(config) {
        return Assertion.generate(config.oauthUrl);
      })
      .then(function(assertion) {
        self._oAuthParams.assertion = assertion;
        return self._oAuthClient.getCode(self._oAuthParams);
      })
      .then(function(result) {
        Session.clear('oauth');

        if (self._channel.completeOAuth) {
          self.completeWithChannel(result, options.source);
          return { pageNavigation: true };
        }
      })
      .fail(function(err) {
        Session.clear('oauth');
        self.displayError(err, OAuthErrors);
      });
    },

    _createChannel: function () {
      return channelFactory.create({
        webChannelId: this._oAuthParams.webChannelId
      });
    },

    completeWithChannel: function (result, source) {
      var self = this;

      var promise = self._channel.completeOAuth(result, source);

      if (!(promise && promise.then)) {
        // a synchronous completion, nothing more to do.
        return;
      }

      var receivedError = false;
      promise.then(function () {
        // done, now what?
        self._buttonProgressIndicator.done();
      })
      .fail(function(err) {
        receivedError = true;
        self.displayError(err, OAuthErrors);
        self._buttonProgressIndicator.done();
      });

      // if sign in then show progress state
      // Assume the receiver of the channel's notification will shut
      // the FxA window. If it doesn't, and no other error was received,
      // assume there is an error.
      if (self.$('button[type=submit]').length > 0) {
        self._buttonProgressIndicator.start(self.$('button[type=submit]'));
        self.setTimeout(function() {
          // if something goes wrong during the WebChannel process
          // but does not send back the error message,
          // then we show a generic error to the user.
          if (! receivedError) {
            // TODO: real errors here
            self.displayError('Something went wrong. Please close this tab and try again.', OAuthErrors);
          }
        }, 10000);
      }
    },

    hasService: function () {
      return !!Session.service;
    },

    isOAuthSameBrowser: function () {
      // The signup/signin flow sets Session.oauth with the
      // Oauth parameters. If the user opens the verification
      // link in the same browser, then we check to make sure
      // the service listed in the link is the same as the client_id
      // in the previously saved Oauth params.
      /* jshint camelcase: false */
      return !!Session.oauth && Session.oauth.client_id === Session.service;
    },

    setupOAuthLinks: function () {
      this.$('a[href~="/signin"]').attr('href', '/oauth/signin');
      this.$('a[href~="/signup"]').attr('href', '/oauth/signup');
    },

    // override this method so we can fix signup/signin links in errors
    displayErrorUnsafe: function (err, errors) {
      var result = BaseView.prototype.displayErrorUnsafe.call(this, err, errors);
      var hasServiceView = this.className.match('oauth');
      if (hasServiceView || this.isOAuthSameBrowser()) {
        this.setupOAuthLinks();
      }
      return result;
    },

    isSync: function () {
      return Session.service === 'sync';
    }
  };
});

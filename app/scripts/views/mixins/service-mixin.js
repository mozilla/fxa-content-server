/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// helper functions for views with passwords. Meant to be mixed into views.

'use strict';

define([
  'lib/promise',
  'views/base',
  'views/form',
  'lib/url',
  'lib/oauth-client',
  'lib/assertion',
  'lib/oauth-errors',
  'lib/config-loader',
  'lib/session',
  'lib/service-name',
  'lib/channels/fx_web',
  'lib/channels/url'
], function (p, BaseView, FormView, Url, OAuthClient, Assertion, OAuthErrors,
    ConfigLoader, Session, ServiceName, FxWebChannel, UrlChannel) {
  /* jshint camelcase: false */

  // If the user completes an OAuth flow using a different browser than
  // they started with, we redirect them back to the RP with this code
  // in the `error_code` query param.
  var RP_DIFFERENT_BROWSER_ERROR_CODE = 3005;

  var SYNC_SERVICE = 'sync';

  var WAIT_FOR_ERROR_TIMEOUT = 10000;

  return {
    setupOAuth: function (params) {
      if (! this._configLoader) {
        this._configLoader = new ConfigLoader();
      }

      this._oAuthClient = new OAuthClient();
      this._oAuthParams = params = this._getOAuthParams(params);

      // FxA auth server API expects a 'service' parameter to include in
      // verification emails. Oauth uses 'client_id', so we set 'service'
      // to the 'client_id'.
      this.service = params.client_id || Session.service;
      Session.set('service', this.service);

      this._channel = this._getChannel();
    },

    _getOAuthParams: function (params) {
      if (params) {
        return params;
      }

      // params listed in:
      // https://github.com/mozilla/fxa-oauth-server/blob/master/docs/api.md#post-v1authorization
      return Url.searchParams(this.window.location.search,
                ['client_id', 'redirect_uri', 'state', 'scope', 'action']);
    },

    _getChannel: function () {
      var channel;

      if (this._oAuthParams.webChannelId) {
        channel = new FxWebChannel();
        channel.init({
          webChannelId: this._oAuthParams.webChannelId
        });
      } else {
        channel = new UrlChannel();
        channel.init({
          window: this.window
        });
      }

      return channel;
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

    shouldAutoFinishOAuthFlow: function () {
      return !! (this._channel && this._channel.completeOAuthNoInteraction);
    },

    finishOAuthFlowDifferentBrowser: function () {
      this._channel.completeOAuthError({
        redirect: this.serviceRedirectURI,
        error: RP_DIFFERENT_BROWSER_ERROR_CODE
      });
    },

    finishOAuthFlow: FormView.showButtonProgressIndicator(function (options) {
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
          return self._completeWithChannel(result, options.source);
        }
        // TODO should we do something if the channel does not have
        // a completeOAuth, or should we add the function to all channels?
      }).then(function() {
        return { pageNavigation: true };
      })
      .fail(function(err) {
        Session.clear('oauth');
        self.displayError(err, OAuthErrors);
      });
    }),

    _completeWithChannel: function (result, source) {
      var self = this;
      // TODO - does this belong here, or should this be in the channel?
      // it seems a bit too specific to be here.

      // Assume the receiver of the channel's notification will shut
      // the FxA window. If it doesn't, and no other error was received,
      // assume there is an error.
      self._waitForErrorTimeout = self.setTimeout(function() {
        // if something goes wrong during the WebChannel process
        // but does not send back the error message,
        // then we show a generic error to the user.
        self.displayError(OAuthErrors.toError('TRY_AGAIN'), OAuthErrors);
      }, WAIT_FOR_ERROR_TIMEOUT);

      return p()
          .then(function () {
            return self._channel.completeOAuth(result, source);
          })
          .then(function () {
            self.clearTimeout(self._waitForErrorTimeout);
          })
          .fail(function (err) {
            self.clearTimeout(self._waitForErrorTimeout);
            throw err;
          });

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
      var result =
              BaseView.prototype.displayErrorUnsafe.call(this, err, errors);

      if (this._shouldSetupOAuthLinks()) {
        this.setupOAuthLinks();
      }

      return result;
    },

    _shouldSetupOAuthLinks: function () {
      var hasServiceView = this.className.match('oauth');
      return hasServiceView || this.isOAuthSameBrowser();
    },

    isSync: function () {
      return Session.service === 'sync';
    }
  };
});

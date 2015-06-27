/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A broker that knows how to finish an OAuth flow. Should be subclassed
 * to override `sendOAuthResultToRelier`
 */

define([
  'underscore',
  'lib/constants',
  'lib/url',
  'lib/oauth-errors',
  'lib/auth-errors',
  'lib/promise',
  'lib/validate',
  'models/auth_brokers/base'
],
function (_, Constants, Url, OAuthErrors, AuthErrors, p, Validate,
      BaseAuthenticationBroker) {
  'use strict';

  /**
   * Formats the OAuth "result.redirect" url into a {code, state} object
   *
   * @param {Object} result
   * @returns {Object}
   */
  function _formatOAuthResult(result) {

    // get code and state from redirect params
    if (! result) {
      return p.reject(OAuthErrors.toError('INVALID_RESULT'));
    } else if (! result.redirect) {
      return p.reject(OAuthErrors.toError('INVALID_RESULT_REDIRECT'));
    }

    var redirectParams = result.redirect.split('?')[1];

    result.state = Url.searchParam('state', redirectParams);
    result.code = Url.searchParam('code', redirectParams);

    if (! Validate.isOAuthCodeValid(result.code)) {
      return p.reject(OAuthErrors.toError('INVALID_RESULT_CODE'));
    }

    return p(result);
  }

  var OAuthAuthenticationBroker = BaseAuthenticationBroker.extend({
    type: 'oauth',
    initialize: function (options) {
      options = options || {};

      this.session = options.session;
      this._fxaClient = options.fxaClient;

      return BaseAuthenticationBroker.prototype.initialize.call(
                  this, options);
    },

    getOAuthResult: function (account) {
      var self = this;
      // Ensure we always return a promise, even on error.
      return p()
        .then(function() {
          if (! account || ! account.get('sessionToken')) {
            return p.reject(AuthErrors.toError('INVALID_TOKEN'));
          }
          var relier = self.relier;
          var params = {
            client_id: relier.get('clientId'), //eslint-disable-line camelcase
            scope: relier.get('scope'),
            state: relier.get('state')
          };
          return self._fxaClient.getOAuthCode(account.get('sessionToken'), params);
        })
        .then(_formatOAuthResult);
    },

    /**
     * Overridden by subclasses to provide a strategy to finish the OAuth flow.
     *
     * @param {string} result.state - state sent by OAuth RP
     * @param {string} result.code - OAuth code generated by the OAuth server
     * @param {string} result.redirect - URL that can be used to redirect to
     * the RP.
     */
    sendOAuthResultToRelier: function (/*result*/) {
      return p.reject(new Error('subclasses must override sendOAuthResultToRelier'));
    },

    finishOAuthSignInFlow: function (account, additionalResultData) {
      additionalResultData = additionalResultData || {};
      additionalResultData.action = Constants.OAUTH_ACTION_SIGNIN;
      return this.finishOAuthFlow(account, additionalResultData);
    },

    finishOAuthSignUpFlow: function (account, additionalResultData) {
      additionalResultData = additionalResultData || {};
      additionalResultData.action = Constants.OAUTH_ACTION_SIGNUP;
      return this.finishOAuthFlow(account, additionalResultData);
    },

    finishOAuthFlow: function (account, additionalResultData) {
      var self = this;
      self.session.clear('oauth');
      return self.getOAuthResult(account)
        .then(function (result) {
          if (additionalResultData) {
            result = _.extend(result, additionalResultData);
          }
          return self.sendOAuthResultToRelier(result);
        });
    },

    persist: function () {
      var self = this;
      return p().then(function () {
        var relier = self.relier;
        self.session.set('oauth', {
          webChannelId: self.get('webChannelId'),
          client_id: relier.get('clientId'), //eslint-disable-line camelcase
          state: relier.get('state'),
          keys: relier.get('keys'),
          scope: relier.get('scope'),
          action: relier.get('action')
        });
      });
    },

    afterSignIn: function (account, additionalResultData) {
      return this.finishOAuthSignInFlow(account, additionalResultData)
        .then(function () {
          // the RP will take over from here, no need for a screen transition.
          return { halt: true };
        });
    },

    afterSignUpConfirmationPoll: function (account) {
      // The original tab always finishes the OAuth flow if it is still open.
      return this.finishOAuthSignUpFlow(account);
    },

    afterResetPasswordConfirmationPoll: function (account) {
      return this.finishOAuthSignInFlow(account);
    },

    transformLink: function (link) {
      return '/oauth' + link;
    }
  });

  return OAuthAuthenticationBroker;
});

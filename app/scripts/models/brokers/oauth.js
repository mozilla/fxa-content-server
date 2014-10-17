/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A broker that knows how to finish an OAuth flow. Should be subclassed
 * to override `finishOAuthFlow`
 */

'use strict';

define([
  'lib/url',
  'lib/auth-errors',
  'lib/promise',
  'models/brokers/base'
], function (Url, AuthErrors, p, DelegatedAuthenticationBroker) {

  /**
   * Formats the OAuth "result.redirect" url into a {code, state} object
   *
   * @param {Object} result
   * @returns {Object}
   */
  function _formatOAuthResult(result) {
    // get code and state from redirect params
    var redirectParams = result.redirect.split('?')[1];
    result.state = Url.searchParam('state', redirectParams);
    result.code = Url.searchParam('code', redirectParams);
    return result;
  }

  var OAuthBroker = DelegatedAuthenticationBroker.extend({
    initialize: function (options) {
      options = options || {};

      this.session = options.session;
      this._assertionLibrary = options.assertionLibrary;
      this._oAuthClient = options.oAuthClient;

      return DelegatedAuthenticationBroker.prototype.initialize.call(
                  this, options);
    },

    getOAuthResult: function () {
      var self = this;
      return self._assertionLibrary.generate(self.session.sessionToken)
        .then(function (assertion) {
          var relier = self.relier;
          var oauthParams = {
            assertion: assertion,
            //jshint camelcase: false
            client_id: relier.get('clientId'),
            scope: relier.get('scope'),
            state: relier.get('state')
          };
          return self._oAuthClient.getCode(oauthParams);
        })
        .then(_formatOAuthResult)
        .then(function (result) {
          self.session.clear('oauth');
          return result;
        }, function (err) {
          self.session.clear('oauth');
          throw err;
        });
    },

    /**
     * Finishes the OAuth flow. Should be overridden by subclasses.
     */
    finishOAuthFlow: function (/*result, source*/) {
      return p.reject(new Error('subclasses must override finishOAuthFlow'));
    },

    afterSignIn: function () {
      return this._finishOAuthFlow('signin');
    },

    beforeSignUpConfirmed: function () {
      return this._prepareForEmailVerification();
    },

    afterSignUpConfirmed: function () {
      return this._finishOAuthFlow('signup');
    },

    beforeResetPasswordConfirmed: function () {
      return this._prepareForEmailVerification();
    },

    afterResetPasswordConfirmed: function () {
      return this._finishOAuthFlow('reset_password');
    },

    transformLink: function (link) {
      return '/oauth' + link;
    },

    _prepareForEmailVerification: function () {
      var self = this;
      return p().then(function () {
        var relier = self.relier;
        self.session.set('oauth', {
          webChannelId: self.get('webChannelId'),
          //jshint camelcase: false
          client_id: relier.get('clientId'),
          state: relier.get('state'),
          scope: relier.get('scope'),
          action: relier.get('action')
        });
      });
    },

    _finishOAuthFlow: function (source) {
      var self = this;
      return self.getOAuthResult()
        .then(function (result) {
          return self.finishOAuthFlow(result, source);
        });
    }
  });

  return OAuthBroker;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


'use strict';

define([
  'backbone',
  'lib/promise',
  'lib/auth-errors',
  'lib/constants'
], function (Backbone, p, AuthErrors, Constants) {

  var ACCOUNT_DATA_KEYS = [
    'uid',
    'email',
    'sessionToken',
    'sessionTokenContext',
    'accessToken',
    'verified',
    'lastLogin'
  ];

  var Account = Backbone.Model.extend({
    defaults: {},

    initialize: function (options) {
      options = options || {};
      var self = this;

      ACCOUNT_DATA_KEYS.forEach(function (key) {
        self[key] = options.accountData[key];
      });

      self._oAuthClientId = options.oAuthClientId;
      self._oAuthClient = options.oAuthClient;
      self._assertion = options.assertion;
      self._profileClient = options.profileClient;
    },

    // Hydrate the account
    fetch: function () {
      var self = this;

      // upgrade the credentials with an accessToken
      if (self.sessionToken && (! self.accessToken || ! self.verified)) {
        return self._getAccessTokenFromSessionToken(self.sessionToken)
          .then(function (accessToken) {
            self.accessToken = accessToken;
            // if we can sign a cert, we must be verified
            self.verified = true;
            return self;
          }, function (err) {
            if (AuthErrors.is(err, 'UNVERIFIED_ACCOUNT')) {
              self.verified = false;
              return self;
            }

            throw err;
          });
      } else {
        return p(self);
      }
    },

    profileClient: function () {
      return this.fetch()
        .then(function (self) {
          return self._profileClient;
        });
    },

    isFromSync: function () {
      return this.sessionTokenContext === Constants.FX_DESKTOP_CONTEXT;
    },

    _getAccessTokenFromSessionToken: function (sessionToken) {
      /* jshint camelcase: false */
      var self = this;
      var params = {
        client_id: self._oAuthClientId,
        scope: 'profile:write'
      };

      return self._assertion.generate(sessionToken)
        .then(function (assertion) {
          params.assertion = assertion;
          return self._oAuthClient.getToken(params);
        })
        .then(function (result) {
          return result.access_token;
        });
    },

    toData: function () {
      var self = this;
      return ACCOUNT_DATA_KEYS.reduce(function (data, key) {
        data[key] = self[key];
        return data;
      }, {});
    },

    isVerified: function () {
      var self = this;
      return self._getAccessTokenFromSessionToken(self.sessionToken)
        .then(function () {
          return true;
        }, function (err) {
          if (AuthErrors.is(err, 'UNVERIFIED_ACCOUNT')) {
            return false;
          }

          throw err;
        });
    }

  });

  ['getAvatar', 'getAvatars', 'postAvatar', 'deleteAvatar', 'uploadAvatar']
    .forEach(function (method) {
      Account.prototype[method] = function () {
        var self = this;
        var args = Array.prototype.slice.call(arguments, 0);
        return self.profileClient()
          .then(function (profileClient) {
            return profileClient[method].apply(profileClient, [self.accessToken].concat(args));
          });
      };
    });


  return Account;
});

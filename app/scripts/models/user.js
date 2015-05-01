/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This module represents a user of the fxa-content-server site.
// It persists accounts the user has logged in with and potentially
// other state about the user that might be useful.
//
// i.e. User hasMany Accounts.


'use strict';

define([
  'backbone',
  'underscore',
  'lib/promise',
  'lib/auth-errors',
  'models/account',
  'lib/storage'
], function (Backbone, _, p, AuthErrors, Account, Storage) {

  var User = Backbone.Model.extend({
    initialize: function (options) {
      options = options || {};
      this._oAuthClientId = options.oAuthClientId;
      this._oAuthClient = options.oAuthClient;
      this._profileClient = options.profileClient;
      this._fxaClient = options.fxaClient;
      this._assertion = options.assertion;
      this._storage = options.storage || Storage.factory();
    },

    _accounts: function () {
      return this._storage.get('accounts') || {};
    },

    _getAccount: function (uid) {
      if (! uid) {
        return null;
      } else {
        return this._accounts()[uid] || null;
      }
    },

    _getSignedInAccount: function () {
      return this._getAccount(this._storage.get('currentAccountUid'));
    },

    // persists account data
    _persistAccount: function (account) {
      var accounts = this._accounts();
      accounts[account.uid] = account;
      this._storage.set('accounts', accounts);
    },

    // A conveinience method that initializes an account instance from
    // raw account data.
    initAccount: function (accountData) {
      if (accountData instanceof Account) {
        // we already have an account instance
        return accountData;
      }

      return new Account({
        accountData: accountData,
        assertion: this._assertion,
        oAuthClient: this._oAuthClient,
        profileClient: this._profileClient,
        fxaClient: this._fxaClient,
        oAuthClientId: this._oAuthClientId
      });
    },

    isSyncAccount: function (account) {
      return this.initAccount(account).isFromSync();
    },

    getSignedInAccount: function () {
      return this.initAccount(this._getSignedInAccount());
    },

    setSignedInAccountByUid: function (uid) {
      if (this._accounts()[uid]) {
        this._storage.set('currentAccountUid', uid);
      }
    },

    getAccountByUid: function (uid) {
      var account = this._accounts()[uid];
      return this.initAccount(account);
    },

    getAccountByEmail: function (email) {
      // Reverse the list so newest accounts are first
      var uids = Object.keys(this._accounts()).reverse();
      var accounts = this._accounts();

      var uid = _.find(uids, function (uid) {
        return accounts[uid].email === email;
      });

      return this.initAccount(accounts[uid]);
    },

    // Return the account selected in the account chooser.
    // Defaults to the last logged in account unless a desktop session
    // has been stored.
    getChooserAccount: function () {
      var self = this;

      var account = _.find(self._accounts(), function (account) {
        return self.isSyncAccount(account);
      }) || self._getSignedInAccount();

      return self.initAccount(account);
    },

    // Used to clear the current account, but keeps the account details
    clearSignedInAccount: function () {
      this._storage.remove('currentAccountUid');
    },

    removeAllAccounts: function () {
      this._storage.remove('currentAccountUid');
      this._storage.remove('accounts');
    },

    // Delete the account from storage
    removeAccount: function (accountData) {
      var account = this.initAccount(accountData);
      var uid = account.get('uid');
      var accounts = this._accounts();

      if (uid === this.getSignedInAccount().get('uid')) {
        this.clearSignedInAccount();
      }
      delete accounts[uid];
      this._storage.set('accounts', accounts);
    },

    // Stores a new account and sets it as the current account.
    setSignedInAccount: function (accountData) {
      var self = this;

      var account = self.initAccount(accountData);
      account.set('lastLogin', Date.now());

      return self.setAccount(account)
        .then(function (account) {
          self._storage.set('currentAccountUid', account.get('uid'));
          return account;
        });
    },

    // Hydrate the account then persist it
    setAccount: function (accountData) {
      var self = this;
      var account = self.initAccount(accountData);
      return account.fetch()
        .then(function () {
          self._persistAccount(account.toPersistentJSON());
          return account;
        });
    },

    // Old sessions store two accounts: The last account the
    // user logged in to FxA with, and the account they logged in to
    // Sync with. If they are different accounts, we'll save both accounts.
    upgradeFromSession: function (Session, fxaClient) {
      var self = this;

      return p()
        .then(function () {
          if (! self.getSignedInAccount().isEmpty()) {
            // We've already upgraded the session
            return;
          }

          var promise = p();

          // add cached Sync account credentials if available
          if (Session.cachedCredentials) {
            promise = self.setSignedInAccount({
              email: Session.cachedCredentials.email,
              sessionToken: Session.cachedCredentials.sessionToken,
              sessionTokenContext: Session.cachedCredentials.sessionTokenContext,
              uid: Session.cachedCredentials.uid
            });
            Session.clear('cachedCredentials');
          }

          if (self._shouldAddOldSessionAccount(Session)) {
            promise = promise
              // The uid was not persisted in localStorage so get it from the auth server
              .then(_.bind(fxaClient.sessionStatus, fxaClient, Session.sessionToken))
              .then(function (result) {
                return self.setSignedInAccount({
                  email: Session.email,
                  sessionToken: Session.sessionToken,
                  sessionTokenContext: Session.sessionTokenContext,
                  uid: result.uid
                })
                .then(function () {
                  Session.clear('email');
                  Session.clear('sessionToken');
                  Session.clear('sessionTokenContext');
                });
              }, function () {
                // if there's an error, just ignore the account
              });
          }

          return promise;
        });
    },

    isSignedIn: function (account) {
      return account.isSignedIn();
    },

    signIn: function (account, relier) {
      var self = this;
      var fxaClient = self._fxaClient;
      return p().then(function () {
        var password = account.get('password');
        var sessionToken = account.get('sessionToken');
        if (password) {
          var email = account.get('email');
          return fxaClient.signIn(email, password, relier);
        } else if (sessionToken) {
          // We have a cached Sync session so just check that it hasn't expired.
          // The result includes the latest verified state
          return fxaClient.recoveryEmailStatus(sessionToken);
        } else {
          throw AuthErrors.toError('UNEXPECTED_ERROR');
        }
      })
      .then(function (updatedSessionData) {
        account.set(updatedSessionData);
        return self.setSignedInAccount(account);
      })
      .then(function () {
        if (! account.get('verified')) {
          return fxaClient.signUpResend(relier, account.get('sessionToken'));
        }
      })
      .then(function () {
        return account;
      });
    },

    signUp: function (account, relier, customizeSync) {
      var self = this;
      var email = account.get('email');
      var password = account.get('password');
      var options = {
        customizeSync: customizeSync
      };

      return self._fxaClient.signUp(email, password, relier, options)
        .then(function (accountData) {
          account.set(accountData);
          return self.setSignedInAccount(account);
        })
        .then(function () {
          return account;
        });
    },

    changePassword: function (account, relier, oldPassword, newPassword) {
      var self = this;
      var fxaClient = self._fxaClient;
      // Try to sign the user in before checking whether the
      // passwords are the same. If the user typed the incorrect old
      // password, they should know that first.
      var email = account.get('email');
      return fxaClient.checkPassword(email, oldPassword)
        .then(function () {
          if (oldPassword === newPassword) {
            throw AuthErrors.toError('PASSWORDS_MUST_BE_DIFFERENT');
          }

          return fxaClient.changePassword(email, oldPassword, newPassword);
        })
        .then(function () {
          // sign the user in, keeping the current sessionTokenContext. This
          // prevents sync users from seeing the `sign out` button on the
          // settings screen.
          return fxaClient.signIn(email, newPassword, relier, {
            sessionTokenContext: account.get('sessionTokenContext')
          });
        })
        .then(function (updatedSessionData) {
          account.set(updatedSessionData);
          return self.setSignedInAccount(account);
        });
    },

    deleteAccount: function (account, password) {
      var self = this;
      return self._fxaClient.deleteAccount(account.get('email'), password)
        .then(function () {
          self.removeAccount(account);
        });

    },

    signOut: function (account) {
      var self = this;
      return p()
        .then(function () {
          var sessionToken = account.get('sessionToken');
          return self._fxaClient.signOut(sessionToken)
        })
        .fail(function () {
          // ignore the error.
          // Even on failure. Everything is A-OK.
          // See issue #616
        })
        .fin(function () {
          self.clearSignedInAccount();
        });
    },

    completePasswordReset: function (account, relier, token, code) {
      var self = this;
      var email = account.get('email');
      var password = account.get('password');
      return self._fxaClient.completePasswordReset(email, password, token, code)
        .then(function () {
          return self.signIn(account, relier);
        });
    },

    // Add the last signed in account (if it's different from the Sync account).
    // If the email is the same we assume it's the same account since users can't change email yet.
    _shouldAddOldSessionAccount: function (Session) {
      return (Session.email && Session.sessionToken &&
        (! Session.cachedCredentials ||
        Session.cachedCredentials.email !== Session.email));
    }

  });

  return User;
});

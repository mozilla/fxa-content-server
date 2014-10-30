/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


'use strict';

define([
  'backbone',
  'lib/promise',
  'lib/assertion',
  'lib/oauth-client',
  'models/account',
  'lib/storage'
], function (Backbone, p, Assertion, OAuthClient, Account, Storage) {

  var User = Backbone.Model.extend({
    defaults: {},

    initialize: function (options) {
      options = options || {};
      this._oAuthClientId = options.oAuthClientId;
      this._oAuthClient = options.oAuthClient;
      this._profileClient = options.profileClient;
      this._assertion = options.assertion;
      this._storage = options.storage || new Storage(localStorage);
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

    _getCurrentAccount: function () {
      return this._getAccount(this._storage.get('currentAccountUid'));
    },

    // persists account data
    _setAccount: function (account) {
      var accounts = this._accounts();
      accounts[account.uid] = account;
      this._storage.set('accounts', accounts);
    },

    // persists account data and sets it as the current account
    _setCurrentAccount: function (account) {
      this._setAccount(account);
      this._storage.set('currentAccountUid', account.uid);
    },

    // Initializes an account instance from raw account data
    createAccount: function (accountData) {
      if (! accountData) {
        return null;
      } else if (accountData.toData) {
        // we already have an account instance
        return accountData;
      }

      return new Account({
        accountData: accountData,
        assertion: this._assertion,
        oAuthClient: this._oAuthClient,
        profileClient: this._profileClient,
        oAuthClientId: this._oAuthClientId
      });
    },

    isSyncAccount: function (account) {
      return !!account && this.createAccount(account).isFromSync();
    },

    getCurrentAccount: function () {
      return this.createAccount(this._getCurrentAccount());
    },

    setCurrentAccountByUid: function (uid) {
      if (this._accounts()[uid]) {
        this._storage.set('currentAccountUid', uid);
      }
    },

    getAccountByUid: function (uid) {
      var account = this._accounts()[uid];
      return account ? this.createAccount(account) : null;
    },

    getAccountByEmail: function (email) {
      var accounts = this._accounts();
      var account = null;
      Object.keys(accounts).forEach(function (uid) {
        if (accounts[uid].email === email) {
          account = accounts[uid];
        }
      });
      return this.createAccount(account);
    },

    // Return the account selected in the account chooser.
    // Defaults to the last logged in account unless a desktop session
    // has been stored.
    getChooserAccount: function () {
      var accounts = this._accounts();
      var account = this._getCurrentAccount();

      // Use the last desktop session if one exists
      for (var uid in accounts) {
        if (this.isSyncAccount(accounts[uid])) {
          account = accounts[uid];
        }
      }

      return this.createAccount(account);
    },

    // Used to clear the current account, but keeps the account details
    clearCurrentAccount: function () {
      this._storage.remove('currentAccountUid');
    },

    removeAllAccounts: function () {
      this._storage.remove('currentAccountUid');
      this._storage.remove('accounts');
    },

    // Delete the account from storage
    removeAccount: function (account) {
      var uid = account.uid;
      var accounts = this._accounts();
      var currentAccount = this.getCurrentAccount();

      if (currentAccount && uid === currentAccount.uid) {
        this.clearCurrentAccount();
      }
      delete accounts[uid];
      this._storage.set('accounts', accounts);
    },

    // Stores a new account and sets it as the current account.
    setCurrentAccount: function (accountData) {
      var self = this;

      accountData.lastLogin = Date.now();

      return self.setAccount(accountData)
        .then(function (account) {
          self._storage.set('currentAccountUid', account.uid);
          return account;
        });
    },

    // Hydrate the account then persist it
    setAccount: function (account) {
      var self = this;
      return self.createAccount(account).fetch()
        .then(function (account) {
          self._setAccount(account.toData());
          return account;
        });
    }

  });

  return User;
});

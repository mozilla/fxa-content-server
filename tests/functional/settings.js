/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'require',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, require, TestHelpers, FunctionalHelpers) {

  var config = intern.config;
  var SIGNIN_URL = config.fxaContentRoot + 'signin';
  var SETTINGS_URL = config.fxaContentRoot + 'settings';

  var thenify = FunctionalHelpers.thenify;

  var clearBrowserState = thenify(FunctionalHelpers.clearBrowserState);
  var createUser = FunctionalHelpers.createUser;
  var fillOutSignIn = thenify(FunctionalHelpers.fillOutSignIn);
  var getFxaClient = FunctionalHelpers.getFxaClient;
  var openTab = FunctionalHelpers.openTab;
  var testElementExists = FunctionalHelpers.testElementExists;
  var testErrorTextInclude = FunctionalHelpers.testErrorTextInclude;

  var FIRST_PASSWORD = 'password';
  var email;
  var accountData;


  registerSuite({
    name: 'settings',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      return this.remote
        .then(createUser(email, FIRST_PASSWORD, { preVerified: true }))
        .then(function (result) {
          accountData = result;
        })
        .then(clearBrowserState(this));
    },

    afterEach: function () {
      return FunctionalHelpers.clearBrowserState(this);
    },

    'with an invalid email': function () {
      return FunctionalHelpers.openPage(this, SETTINGS_URL + '?email=invalid', '#fxa-400-header')
        .then(testErrorTextInclude('invalid'))
        .then(testErrorTextInclude('email'));
    },

    'with an empty email': function () {
      return FunctionalHelpers.openPage(this, SETTINGS_URL + '?email=', '#fxa-400-header')
        .then(testErrorTextInclude('invalid'))
        .then(testErrorTextInclude('email'));
    },

    'with an invalid uid': function () {
      return FunctionalHelpers.openPage(this, SETTINGS_URL + '?uid=invalid', '#fxa-400-header')
        .then(testErrorTextInclude('invalid'))
        .then(testErrorTextInclude('uid'));
    },

    'with an empty uid': function () {
      return FunctionalHelpers.openPage(this, SETTINGS_URL + '?uid=', '#fxa-400-header')
        .then(testErrorTextInclude('invalid'))
        .then(testErrorTextInclude('uid'));
    },

    'sign in, go to settings, sign out': function () {
      var self = this;
      return FunctionalHelpers.openPage(this, SIGNIN_URL, '#fxa-signin-header')
        .then(function () {
          return FunctionalHelpers.fillOutSignIn(self, email, FIRST_PASSWORD);
        })

        .findByCssSelector('#fxa-settings-header')
        .end()

        // sign the user out
        .findById('signout')
          .click()
        .end()

        // success is going to the signin page
        .findById('fxa-signin-header')
        .end();
    },

    'sign in, go to settings with setting param set to avatar redirects to avatar change page ': function () {
      var self = this;
      return FunctionalHelpers.fillOutSignIn(self, email, FIRST_PASSWORD, true)

        .findById('fxa-settings-header')
        .end()

        .then(function () {
          return FunctionalHelpers.openPage(self, SETTINGS_URL + '?setting=avatar', '#avatar-options');
        })

        .findByCssSelector('.avatar-panel button.cancel')
          .click()
        .end()

        // Should not redirect after clicking the home button
        .findById('fxa-settings-header')
        .end();
    },

    'sign in, go to settings with setting param and additional params redirects to avatar change page ': function () {
      var self = this;
      return FunctionalHelpers.fillOutSignIn(self, email, FIRST_PASSWORD, true)

        .findById('fxa-settings-header')
        .end()

        .then(function () {
          return FunctionalHelpers.openPage(self, SETTINGS_URL + '?setting=avatar&uid=' + accountData.uid, '#avatar-options');
        })

        .findByCssSelector('.avatar-panel button.cancel')
          .click()
        .end()

        // Should not redirect after clicking the home button
        .findById('fxa-settings-header')
        .end();
    },

    'sign in with setting param set to avatar redirects to avatar change page ': function () {
      var self = this;
      return FunctionalHelpers.openPage(self, SIGNIN_URL + '?setting=avatar', '#fxa-signin-header')
        .then(function () {
          return FunctionalHelpers.fillOutSignIn(self, email, FIRST_PASSWORD);
        })
        .findById('avatar-options')
        .end();
    },

    'sign in with setting param and additional params redirects to avatar change page ': function () {
      var self = this;
      return FunctionalHelpers.openPage(self, SIGNIN_URL + '?setting=avatar&uid=' + accountData.uid, '#fxa-signin-header')
        .then(function () {
          return FunctionalHelpers.fillOutSignIn(self, email, FIRST_PASSWORD);
        })
        .findById('avatar-options')
        .end();
    },

    'sign in, open settings in a second tab, sign out': function () {
      var windowName = 'sign-out inter-tab functional test';
      var self = this;
      return FunctionalHelpers.fillOutSignIn(this, email, FIRST_PASSWORD)
        .then(function () {
          return FunctionalHelpers.openSettingsInNewTab(self, windowName);
        })
        .switchToWindow(windowName)

        .findById('fxa-settings-header')
        .end()

        .findById('signout')
          .click()
        .end()

        .findById('fxa-signin-header')
        .end()

        .closeCurrentWindow()
        .switchToWindow('')

        .findById('fxa-signin-header')
        .end();
    }
  });

  registerSuite({
    name: 'settings unverified',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      return this.remote
        .then(createUser(email, FIRST_PASSWORD))
        .then(clearBrowserState(this));
    },

    afterEach: function () {
      return FunctionalHelpers.clearBrowserState(this);
    },

    'visit settings page with an unverified account redirects to confirm': function () {
      var self = this;

      return FunctionalHelpers.fillOutSignIn(self, email, FIRST_PASSWORD)
        .findById('fxa-confirm-header')
        .end()

        .get(require.toUrl(SETTINGS_URL))
        // Expect to get redirected to confirm since the account is unverified
        .findById('fxa-confirm-header')
        .end();
    }
  });

  registerSuite({
    name: 'settings with expired session',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      return this.remote
        .then(createUser(email, FIRST_PASSWORD, { preVerified: true }))
        .then(clearBrowserState(this))
        .then(fillOutSignIn(this, email, FIRST_PASSWORD))
        .then(testElementExists('#fxa-settings-header'))
        .execute(function () {
          // get the first (and only) stored account data, we want to destroy
          // the session.
          var accounts = JSON.parse(localStorage.getItem('__fxa_storage.accounts')) || {};
          var firstKey = Object.keys(accounts)[0];
          return accounts[firstKey];
        })
        .then(function (_accountData) {
          accountData = _accountData;
        });
    },

    'click on settings page after session expires redirects to signin': function () {
      return this.remote
        // open a new tab so the settings page loses focus
        .then(openTab('https://www.example.com', '_newtab'))
        .switchToWindow('_newtab')
        .then(function () {
          return getFxaClient().sessionDestroy(accountData.sessionToken);
        })
        .closeCurrentWindow()
        .switchToWindow('')
        // switching to the window automatically focuses the window, which
        // causes redirect to the signin page.
        .then(testElementExists('#fxa-signin-header'));
    }
  });
});

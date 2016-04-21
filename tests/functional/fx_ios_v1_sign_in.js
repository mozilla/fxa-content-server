/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/fx-desktop',
  'tests/functional/templates/sync_sign_in'
], function (intern, TestHelpers, FunctionalHelpers, FxDesktopHelpers,
  syncSignInTemplate) {
  var config = intern.config;
  var PAGE_URL = config.fxaContentRoot + 'signin?context=fx_ios_v1&service=sync';
  var EXCLUDE_SIGNUP_PAGE_URL = PAGE_URL + '&exclude_signup=1';

  var thenify = FunctionalHelpers.thenify;

  var clearBrowserState = thenify(FunctionalHelpers.clearBrowserState);
  var fillOutSignIn = thenify(FunctionalHelpers.fillOutSignIn);
  var listenForFxaCommands = FxDesktopHelpers.listenForFxaCommands;
  var noSuchElement = FunctionalHelpers.noSuchElement;
  var openPage = thenify(FunctionalHelpers.openPage);
  var testElementExists = FunctionalHelpers.testElementExists;
  var visibleByQSA = FunctionalHelpers.visibleByQSA;

  var PASSWORD = '12345678';

  syncSignInTemplate({
    canLinkAccountMessage: 'can_link_account',
    context: 'fx_ios_v1',
    loginMessage: 'login',
    name: 'FxiOS v1 sign_in',
    useFxAccountsCommands: true
  }, {
    'signup link is disabled': function () {
      return this.remote
        .then(clearBrowserState(this))
        .then(openPage(this, EXCLUDE_SIGNUP_PAGE_URL, '#fxa-signin-header'))
        .then(noSuchElement(this, 'a[href="/signup"]'))
        .end();
    },

    'signup link is enabled': function () {
      return this.remote
        .then(clearBrowserState(this))
        .then(openPage(this, PAGE_URL, '#fxa-signin-header'))
        .then(testElementExists('a[href="/signup"]'));
    },

    'signin with an unknown account does not allow the user to sign up': function () {
      var email = TestHelpers.createEmail();

      return this.remote
        .then(clearBrowserState(this))
        .then(openPage(this, PAGE_URL, '#fxa-signin-header'))
        .execute(listenForFxaCommands)

        .then(fillOutSignIn(this, email, PASSWORD))

        // an error is visible
        .then(visibleByQSA('.error'));
    }
  });
});

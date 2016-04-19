/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, TestHelpers, FunctionalHelpers) {
  var config = intern.config;
  var PAGE_URL = config.fxaContentRoot + 'signin?context=fx_desktop_v2&service=sync&forceAboutAccounts=true';

  var email;
  var PASSWORD = '12345678';

  var thenify = FunctionalHelpers.thenify;

  var clearBrowserState = thenify(FunctionalHelpers.clearBrowserState);
  var createUser = FunctionalHelpers.createUser;
  var fillOutSignIn = thenify(FunctionalHelpers.fillOutSignIn);
  var openPage = thenify(FunctionalHelpers.openPage);
  var respondToWebChannelMessage = FunctionalHelpers.respondToWebChannelMessage;
  var testElementExists = FunctionalHelpers.testElementExists;
  var testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;

  var setupTest = thenify(function (context, isUserVerified) {
    return this.parent
      .then(clearBrowserState(context, { force: true }))
      .then(createUser(email, PASSWORD, { preVerified: isUserVerified }))
      .then(openPage(context, PAGE_URL, '#fxa-signin-header'))
      .then(respondToWebChannelMessage(context, 'fxaccounts:can_link_account', { ok: true } ))
      .then(fillOutSignIn(context, email, PASSWORD))

      .then(testIsBrowserNotified(context, 'fxaccounts:can_link_account'))
      .then(testIsBrowserNotified(context, 'fxaccounts:login'))

      // Sync users must always re-verify their email
      .then(testElementExists(isUserVerified ? '#fxa-confirm-signin-header' : '#fxa-confirm-header'));
  });

  registerSuite({
    name: 'Firefox Desktop Sync v2 sign_in',

    beforeEach: function () {
      email = TestHelpers.createEmail();
    },

    'verified': function () {
      return this.remote
        .then(setupTest(this, true));

      /*
         TODO - add tests to re-verify email
      .then(noSuchBrowserNotification(self, 'fxaccounts:sync_preferences'))
      // user should be able to click on a sync preferences button.
      .then(click('#sync-preferences'))

      // browser is notified of desire to open Sync preferences
      .then(testIsBrowserNotified(self, 'fxaccounts:sync_preferences'));
      */
    },

    'unverified': function () {
      return this.remote
        .then(setupTest(this, false));
    }
  });
});

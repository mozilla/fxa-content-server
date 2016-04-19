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
  var PAGE_URL = config.fxaContentRoot + 'signin?context=fx_fennec_v1&service=sync';

  var email;
  var PASSWORD = '12345678';

  var thenify = FunctionalHelpers.thenify;

  var clearBrowserState = thenify(FunctionalHelpers.clearBrowserState);
  var click = FunctionalHelpers.click;
  var createUser = FunctionalHelpers.createUser;
  var fillOutSignIn = thenify(FunctionalHelpers.fillOutSignIn);
  var noPageTransition = FunctionalHelpers.noPageTransition;
  var noSuchBrowserNotification = FunctionalHelpers.noSuchBrowserNotification;
  var openPage = thenify(FunctionalHelpers.openPage);
  var openVerificationLinkDifferentBrowser = thenify(FunctionalHelpers.openVerificationLinkDifferentBrowser);
  var openVerificationLinkInNewTab = thenify(FunctionalHelpers.openVerificationLinkInNewTab);
  var respondToWebChannelMessage = FunctionalHelpers.respondToWebChannelMessage;
  var testElementExists = FunctionalHelpers.testElementExists;
  var testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;

  var setupTest = thenify(function (context, preVerified) {
    return this.parent
      .then(clearBrowserState(context))
      .then(createUser(email, PASSWORD, { preVerified: preVerified }))
      .then(openPage(context, PAGE_URL, '#fxa-signin-header'))
      .then(noSuchBrowserNotification(context, 'fxaccounts:logout'))
      .then(respondToWebChannelMessage(context, 'fxaccounts:can_link_account', { ok: true } ))
      .then(fillOutSignIn(context, email, PASSWORD))
      .then(testIsBrowserNotified(context, 'fxaccounts:can_link_account'))
      .then(testIsBrowserNotified(context, 'fxaccounts:login'));
  });

  registerSuite({
    name: 'Fx Fennec Sync v1 sign_in',

    beforeEach: function () {
      email = TestHelpers.createEmail();
    },

    'verified, verify same browser': function () {
      return this.remote
        .then(setupTest(this, true))

        .then(testElementExists('#fxa-confirm-signin-header'))

        .then(openVerificationLinkInNewTab(this, email, 0))
        .switchToWindow('newwindow')
          .then(testElementExists('#fxa-sign-in-complete-header'))
          .then(noSuchBrowserNotification(this, 'fxaccounts:sync_preferences'))
          // user wants to open sync preferences.
          .then(click('#sync-preferences'))

          // browser is notified of desire to open Sync preferences
          .then(testIsBrowserNotified(this, 'fxaccounts:sync_preferences'))
          .closeCurrentWindow()
        .switchToWindow('')

        // about:accounts will take over post-verification, no transition
        .then(noPageTransition('#fxa-confirm-signin-header'))

        .then(noSuchBrowserNotification(this, 'fxaccounts:sync_preferences'))
        // user wants to open sync preferences.
        .then(click('#sync-preferences'))

        // browser is notified of desire to open Sync preferences
        .then(testIsBrowserNotified(this, 'fxaccounts:sync_preferences'));
    },

    'verified, verify different browser - from original tab\'s P.O.V.': function () {
      return this.remote
        .then(setupTest(this, true))

        .then(openVerificationLinkDifferentBrowser(email))

        // about:accounts will take over post-verification, no transition
        .then(noPageTransition('#fxa-confirm-signin-header'));
    },

    'unverified': function () {
      return this.remote
        .then(setupTest(this, false))

        .then(testElementExists('#fxa-confirm-header'));
    }
  });
});

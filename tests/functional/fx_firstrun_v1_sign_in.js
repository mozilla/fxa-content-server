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
  var PAGE_URL = config.fxaContentRoot + 'signin?context=iframe&service=sync';
  var NO_REDIRECT_URL = PAGE_URL + '&haltAfterSignIn=true';

  var email;
  var PASSWORD = '12345678';

  var thenify = FunctionalHelpers.thenify;

  var clearBrowserState = thenify(FunctionalHelpers.clearBrowserState);
  var createUser = FunctionalHelpers.createUser;
  var fillOutSignIn = thenify(FunctionalHelpers.fillOutSignIn);
  var noSuchElement = FunctionalHelpers.noSuchElement;
  var openPage = thenify(FunctionalHelpers.openPage);
  var respondToWebChannelMessage = FunctionalHelpers.respondToWebChannelMessage;
  var testElementExists = FunctionalHelpers.testElementExists;

  var testIsBrowserNotified = function (message) {
    message = message.replace(/:/g, '-');
    return function () {
      return this.parent
       .findByCssSelector('#message-' + message)
       .end();
    };
  };

  registerSuite({
    name: 'Firstrun v1 sign_in',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      return this.remote
        .then(clearBrowserState(this));
    },

    'verified': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openPage(this, PAGE_URL, '#fxa-signin-header'))
        .then(respondToWebChannelMessage(this, 'fxaccounts:can_link_account', { ok: true } ))

        .then(fillOutSignIn(this, email, PASSWORD))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(testElementExists('#fxa-settings-header'))
        // the user should be unable to sign out.
        .then(noSuchElement(this, '#signout'));
    },

    'unverified': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: false }))
        .then(openPage(this, PAGE_URL, '#fxa-signin-header'))
        .then(respondToWebChannelMessage(this, 'fxaccounts:can_link_account', { ok: true } ))

        .then(fillOutSignIn(this, email, PASSWORD))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(testElementExists('#fxa-confirm-header'));
    },

    'with an existing account with the `haltAfterSignIn=true` query parameter': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openPage(this, NO_REDIRECT_URL, '#fxa-signin-header'))
        .then(respondToWebChannelMessage(this, 'fxaccounts:can_link_account', { ok: true } ))

        .then(fillOutSignIn(this, email, PASSWORD))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(testElementExists('#fxa-signin-header'))
        .then(noSuchElement(this, '#fxa-settings-header'));
    },

    'signin, cancel merge warning': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openPage(this, PAGE_URL, '#fxa-signin-header'))
        .then(respondToWebChannelMessage(this, 'fxaccounts:can_link_account', { ok: false } ))

        .then(fillOutSignIn(this, email, PASSWORD))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        // user should not transition to the next screen
        .then(testElementExists('#fxa-signin-header'))
        .then(noSuchElement(this, '#fxa-confirm-signin-header'));
    }
  });
});

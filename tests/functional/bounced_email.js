/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/browser_modules/dojo/node!xmlhttprequest',
  'app/bower_components/fxa-js-client/fxa-client',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, nodeXMLHttpRequest, FxaClient, TestHelpers, FunctionalHelpers) {
  var config = intern.config;
  var AUTH_SERVER_ROOT = config.fxaAuthRoot;
  var SIGNIN_URL = config.fxaContentRoot + 'signin';

  var bouncedEmail;
  var deliveredEmail;
  var PASSWORD = '12345678';

  const {
    clearBrowserState,
    click,
    createUser,
    fillOutSignIn,
    fillOutSignUp,
    openPage,
    respondToWebChannelMessage,
    testElementExists,
    testIsBrowserNotified,
    thenify
  } = FunctionalHelpers;

  registerSuite({
    name: 'sign_up with an email that bounces',

    beforeEach: function () {
      bouncedEmail = TestHelpers.createEmail();
      deliveredEmail = TestHelpers.createEmail();
      return this.remote
        .then(clearBrowserState())
        // ensure a fresh signup page is loaded. If this suite is
        // run after a Sync suite, these tests try to use a Sync broker
        // which results in a channel timeout.
        .then(openPage(SIGNIN_URL, '#fxa-signin-header'));

    },

    afterEach: function () {
      return this.remote.then(clearBrowserState());
    },

    'sign up, bounce email, allow user to restart flow but force a different email': function () {
      var client = new FxaClient(AUTH_SERVER_ROOT, {
        xhr: nodeXMLHttpRequest.XMLHttpRequest
      });

      return this.remote
        .then(fillOutSignUp(bouncedEmail, PASSWORD))
        .findById('fxa-confirm-header')
        .end()

        .then(function () {
          return client.accountDestroy(bouncedEmail, PASSWORD);
        })

        .findById('fxa-signup-header')
        .end()

        // expect an error message to already be present on redirect
        .then(FunctionalHelpers.visibleByQSA('.tooltip'))

        // submit button should be disabled.
        .findByCssSelector('button[type="submit"].disabled')
        .end()

        .findByCssSelector('input[type="email"]')
          .clearValue()
          .click()
          .type(bouncedEmail)
        .end()

        // user must change the email address
        .findByCssSelector('button[type="submit"].disabled')
          .click()
        .end()

        // error message should still be around
        .then(FunctionalHelpers.visibleByQSA('.tooltip'))

        .findByCssSelector('input[type="email"]')
          .clearValue()
          .click()
          .type(deliveredEmail)
        .end()

        .findByCssSelector('button[type="submit"]')
          .click()
        .end()

        .findById('fxa-confirm-header')
        .end();
    }

  });

  const setUpBouncedSignIn = thenify(function () {
    const client = new FxaClient(AUTH_SERVER_ROOT, {
      xhr: nodeXMLHttpRequest.XMLHttpRequest
    });

    const email = TestHelpers.createEmail('sync{id}');

    return this.parent
      .then(clearBrowserState({ force: true }))
      .then(createUser(email, PASSWORD, { preVerified: true }))
      .then(openPage(`${config.fxaContentRoot}signin?context=fx_desktop_v2&service=sync`, '#fxa-signin-header'))
      .then(respondToWebChannelMessage('fxaccounts:can_link_account', { ok: true }))
      .then(fillOutSignIn(email, PASSWORD))
      .then(testElementExists('#fxa-confirm-signin-header'))
      .then(testIsBrowserNotified('fxaccounts:can_link_account'))
      .then(testIsBrowserNotified('fxaccounts:login'))
      .then(() => client.accountDestroy(email, PASSWORD))
      .then(testElementExists('#fxa-signin-bounced-header'));
  });

  registerSuite({
    name: 'sign_in with an email that bounces',

    afterEach () {
      return this.remote.then(clearBrowserState());
    },

    'click create-account': function () {
      return this.remote
        .then(setUpBouncedSignIn())
        .then(click('#create-account'))
        .then(testElementExists('#fxa-signup-header'));
    },

    'click back': function () {
      return this.remote
        .then(setUpBouncedSignIn())
        .then(click('#back'))
        .then(testElementExists('#fxa-signin-header'));
    }
  });
});

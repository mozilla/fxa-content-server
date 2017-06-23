/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/selectors'
], function (intern, registerSuite, TestHelpers, FunctionalHelpers, selectors) {
  'use strict';

  const config = intern.config;
  const PAGE_URL = `${config.fxaContentRoot}?context=fx_firstrun_v2&service=sync&automatedBrowser=true&action=email`;

  let email;
  const PASSWORD = '12345678';

  const clearBrowserState = FunctionalHelpers.clearBrowserState;
  const click = FunctionalHelpers.click;
  const closeCurrentWindow = FunctionalHelpers.closeCurrentWindow;
  const createUser = FunctionalHelpers.createUser;
  const openPage = FunctionalHelpers.openPage;
  const openVerificationLinkInNewTab = FunctionalHelpers.openVerificationLinkInNewTab;
  const testElementExists = FunctionalHelpers.testElementExists;
  const testElementValueEquals = FunctionalHelpers.testElementValueEquals;
  const testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;
  const type = FunctionalHelpers.type;
  const visibleByQSA = FunctionalHelpers.visibleByQSA;

  registerSuite({
    name: 'Firstrun Sync v2 email first',

    beforeEach: function () {
      email = TestHelpers.createEmail('sync{id}');

      return this.remote
        .then(clearBrowserState({ force: true }));
    },

    'signup': function () {
      return this.remote
        .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': { ok: true }
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        .then(testElementValueEquals(selectors.SIGNUP_PASSWORD.EMAIL, email))
        .then(type(selectors.SIGNUP_PASSWORD.PASSWORD, PASSWORD))
        .then(type(selectors.SIGNUP_PASSWORD.VPASSWORD, PASSWORD))
        .then(type(selectors.SIGNUP_PASSWORD.AGE, 21))
        .then(click(selectors.SIGNUP_PASSWORD.SUBMIT))

        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT))

        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(openVerificationLinkInNewTab(email, 0))
        .switchToWindow('newwindow')
          .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
          .then(closeCurrentWindow())

        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER));
    },

    'signin - merge cancelled': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': { ok: false }
          }
        }))

        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT))

        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(testElementExists(selectors.ENTER_EMAIL.ERROR));
    },

    'signin verified': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': { ok: true }
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        .then(testElementExists(selectors.SIGNIN_PASSWORD.HEADER))
        .then(testElementValueEquals(selectors.SIGNIN_PASSWORD.EMAIL, email))
        .then(type(selectors.SIGNIN_PASSWORD.PASSWORD, PASSWORD))
        .then(click(selectors.SIGNIN_PASSWORD.SUBMIT))

        .then(testElementExists(selectors.CONFIRM_SIGNIN.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(openVerificationLinkInNewTab(email, 0))
        .switchToWindow('newwindow')
          .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER))
          .then(closeCurrentWindow())

        .then(testElementExists(selectors.SIGNIN_COMPLETE.HEADER));
    },

    'signin unverified': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: false }))
        .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': { ok: true }
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        // The /account/status endpoint does not return whether the account
        // is verified, only whether the email has been registered
        .then(testElementExists(selectors.SIGNIN_PASSWORD.HEADER))
        .then(testElementValueEquals(selectors.SIGNIN_PASSWORD.EMAIL, email))
        .then(type(selectors.SIGNIN_PASSWORD.PASSWORD, PASSWORD))
        .then(click(selectors.SIGNIN_PASSWORD.SUBMIT))

        // The user never verified their account and must do so.
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'))

        // Get the 2nd email, the 1st was sent for createUser
        .then(openVerificationLinkInNewTab(email, 1))
        .switchToWindow('newwindow')
          .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
          .then(closeCurrentWindow())

        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER));
    }
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, TestHelpers, FunctionalHelpers) {

  const config = intern.config;
  const SIGNUP_URL = config.fxaContentRoot + 'signup';
  const PASSWORD = 'password';

  let email;
  let secondaryEmail;

  const clearBrowserState = FunctionalHelpers.clearBrowserState;
  const click = FunctionalHelpers.click;
  const type = FunctionalHelpers.type;
  const fillOutSignUp = FunctionalHelpers.fillOutSignUp;
  const openVerificationLinkInSameTab = FunctionalHelpers.openVerificationLinkInSameTab;
  const openPage = FunctionalHelpers.openPage;
  const testElementExists = FunctionalHelpers.testElementExists;
  const fillOutSignIn = FunctionalHelpers.fillOutSignIn;
  const testElementTextEquals = FunctionalHelpers.testElementTextEquals;

  registerSuite({
    name: 'settings secondary emails',

    beforeEach: function () {
      email = TestHelpers.createEmail();
      secondaryEmail = TestHelpers.createEmail();

      return this.remote.then(clearBrowserState());
    },

    afterEach: function () {
      return this.remote.then(clearBrowserState());
    },

    'add and verify secondary email': function () {
      return this.remote
        // sign up via the UI, we need a verified session to use secondary email
        .then(openPage(SIGNUP_URL, '#fxa-signup-header'))
        .then(fillOutSignUp(email, PASSWORD))
        .then(testElementExists('#fxa-confirm-header'))
        .then(openVerificationLinkInSameTab(email, 0))
        .then(testElementExists('#fxa-settings-header'))
        .then(click('#emails .settings-unit-stub button'))

        // attempt to the same email as primary
        .then(type('.new-email', email))
        .then(click('.email-add:not(.disabled)'))
        // TODO: see error ALREADY PRIMARY

        // add secondary email, resend and remove
        .then(type('.new-email', TestHelpers.createEmail()))
        .then(click('.email-add:not(.disabled)'))
        .then(testElementExists('.not-verified'))
        .then(click('.email-disconnect'))

        // add secondary email, verify
        .then(type('.new-email', secondaryEmail))
        .then(click('.email-add:not(.disabled)'))
        .then(testElementExists('.not-verified'))
        .then(openVerificationLinkInSameTab(secondaryEmail, 0))

        .then(click('#emails .settings-unit-stub button'))

        .then(testElementTextEquals('#emails .address', secondaryEmail));
        // TODO: NOT VERIFIED at the moment
        //.then(testElementExists('.verified'));
    },

    'add secondary email that is primary to another account': function () {
      const unverifiedAccountEmail = TestHelpers.createEmail();

      return this.remote
        // create unverified account with email that is going to be a secondary email for another account
        .then(openPage(SIGNUP_URL, '#fxa-signup-header'))
        .then(fillOutSignUp(unverifiedAccountEmail, PASSWORD))
        .then(testElementExists('#fxa-confirm-header'))

        // sign up and verify
        .then(openPage(SIGNUP_URL, '#fxa-signup-header'))
        .then(fillOutSignUp(email, PASSWORD))
        .then(testElementExists('#fxa-confirm-header'))
        .then(openVerificationLinkInSameTab(email, 0))
        .then(click('#emails .settings-unit-stub button'))
        .then(type('.new-email', unverifiedAccountEmail))
        .then(click('.email-add:not(.disabled)'));
        // TODO: ERROR VISIBLE: Email already exists
    },

    'signin and signup with existing secondary email': function () {
      return this.remote
        // sign up via the UI, we need a verified session to use secondary email
        .then(openPage(SIGNUP_URL, '#fxa-signup-header'))
        .then(fillOutSignUp(email, PASSWORD))
        .then(testElementExists('#fxa-confirm-header'))
        .then(openVerificationLinkInSameTab(email, 0))
        .then(testElementExists('#fxa-settings-header'))
        .then(click('#emails .settings-unit-stub button'))

        .then(type('.new-email', secondaryEmail))
        .then(click('.email-add:not(.disabled)'))
        .then(testElementExists('.not-verified'))
        .then(openVerificationLinkInSameTab(secondaryEmail, 0))

        .then(click('#emails .settings-unit-stub button'))
        // TODO: check VERIFIED here
        .then(click('#signout'))
        .then(testElementExists('#fxa-signin-header'))
        // try to signin with the secondary email
        .then(fillOutSignIn(secondaryEmail, PASSWORD))
        // TODO: what to do here?
        // try to signup with the secondary email
        .then(openPage(SIGNUP_URL, '#fxa-signup-header'))
        .then(fillOutSignUp(email, PASSWORD));
    },

    'signin confirmation': function () {

    },

    'reset password': function () {

    },

  });
});

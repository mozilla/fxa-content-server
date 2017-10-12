/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'tests/lib/helpers',
  'tests/lib/basket',
  'tests/functional/lib/helpers',
  'tests/functional/lib/selectors'
], function (intern, registerSuite, TestHelpers, _waitForBasket, FunctionalHelpers, selectors) {
  const SIGNIN_PAGE_URL = intern.config.fxaContentRoot + 'signin';
  const SIGNUP_PAGE_URL = intern.config.fxaContentRoot + 'signup';
  const fxaProduction = intern.config.fxaProduction;

  let email;
  const PASSWORD = '12345678';

  const {
    clearBrowserState,
    click,
    createUser,
    fillOutSignIn,
    fillOutSignUp,
    noSuchElement,
    openPage,
    openVerificationLinkInSameTab,
    testElementExists,
    testSuccessWasShown,
    visibleByQSA,
  } = FunctionalHelpers;

  const waitForBasket = _waitForBasket;

  const suiteName = 'communication preferences';
  if (fxaProduction) {
    // The actual tests below depend on polling a real or mock implementation
    // of Basket. This isn't something feasible when running this server
    // against a remote server (api keys unavailable, or server only listening
    // to its localhost interface). So, we skip these tests by registering an
    // empty test suite.
    registerSuite({
      name: suiteName
    });
    return;
  }

  // okay, not remote so run these for real.
  registerSuite({
    name: suiteName,

    beforeEach: function () {
      email = TestHelpers.createEmail();
      return this.remote
        .then(clearBrowserState());
    },

    afterEach: function () {
      return this.remote
        .then(clearBrowserState());
    },

    'opt-in on signup': function () {
      // The plus sign is to ensure the email address is URI-encoded when
      // passed to basket. See a43061d3
      email = TestHelpers.createEmail('signup{id}+extra');
      return this.remote
        .then(openPage(SIGNUP_PAGE_URL, '#fxa-signup-header'))
        .then(fillOutSignUp(email, PASSWORD, { optInToMarketingEmail: true }))

        .then(testElementExists('#fxa-confirm-header'))
        .then(openVerificationLinkInSameTab(email, 0))

        .then(testElementExists('#communication-preferences.basket-ready'))
        .then(waitForBasket(email))
        .then(click('#communication-preferences .settings-unit-toggle'))
        .then(visibleByQSA('#communication-preferences .settings-unit-details'))

        // user signed up to basket, so has a manage URL
        .then(testElementExists(selectors.SETTINGS_COMMUNICATION.BUTTON_MANAGE));
    },

    'opt-in from settings after signup': function () {
      return this.remote
        .then(openPage(SIGNUP_PAGE_URL, '#fxa-signup-header'))
        .then(fillOutSignUp(email, PASSWORD, { optInToMarketingEmail: false }))

        .then(testElementExists('#fxa-confirm-header'))
        .then(openVerificationLinkInSameTab(email, 0))

        .then(testElementExists('#communication-preferences.basket-ready'))
        .then(click('#communication-preferences .settings-unit-toggle'))

        .then(visibleByQSA('#communication-preferences .settings-unit-details'))

        .then(testElementExists(selectors.SETTINGS_COMMUNICATION.BUTTON_OPT_IN))
        .then(testSuccessWasShown())
        .then(waitForBasket(email))

        // ensure the opt-in sticks across refreshes
        .refresh()
        .then(testElementExists('#communication-preferences.basket-ready'))
        .then(click('#communication-preferences .settings-unit-toggle'))
        .then(visibleByQSA('#communication-preferences .settings-unit-details'))
        // user should now have a preferences URL
        .then(testElementExists(selectors.SETTINGS_COMMUNICATION.BUTTON_MANAGE));
    },

    'opt-in from settings after signin': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openPage(SIGNIN_PAGE_URL, '#fxa-signin-header'))
        .then(fillOutSignIn(email, PASSWORD))

        .then(testElementExists('#communication-preferences.basket-ready'))
        .then(click('#communication-preferences .settings-unit-toggle'))

        .then(visibleByQSA('#communication-preferences .settings-unit-details'))

        // user does not have a basket account, so the
        // manage link does not exist.

        .then(noSuchElement(selectors.SETTINGS_COMMUNICATION.BUTTON_MANAGE))
        .then(click(selectors.SETTINGS_COMMUNICATION.BUTTON_OPT_IN))
        .then(testSuccessWasShown())
        .then(waitForBasket(email))

        // ensure the opt-in sticks across refreshes
        .refresh()
        .then(testElementExists('#communication-preferences.basket-ready'))
        .then(click('#communication-preferences .settings-unit-toggle'))
        .then(visibleByQSA('#communication-preferences .settings-unit-details'))
        // user should now have a preferences URL
        .then(testElementExists(selectors.SETTINGS_COMMUNICATION.BUTTON_MANAGE));
    }
  });

});

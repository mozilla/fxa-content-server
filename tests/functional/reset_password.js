/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/browser_modules/dojo/node!xmlhttprequest',
  'app/bower_components/fxa-js-client/fxa-client',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/selectors'
], function (intern, registerSuite, nodeXMLHttpRequest,
      FxaClient, TestHelpers, FunctionalHelpers, selectors) {
  'use strict';

  const config = intern.config;
  const AUTH_SERVER_ROOT = config.fxaAuthRoot;
  const SIGNIN_PAGE_URL = config.fxaContentRoot + 'signin';
  const RESET_PAGE_URL = config.fxaContentRoot + 'reset_password';
  const CONFIRM_PAGE_URL = config.fxaContentRoot + 'confirm_reset_password';
  const COMPLETE_PAGE_URL_ROOT = config.fxaContentRoot + 'complete_reset_password';

  const PASSWORD = 'password';
  const TIMEOUT = 90 * 1000;

  let client;
  let code;
  let email;
  let token;

  const clearBrowserState = FunctionalHelpers.clearBrowserState;
  const click = FunctionalHelpers.click;
  const closeCurrentWindow = FunctionalHelpers.closeCurrentWindow;
  const createUser = FunctionalHelpers.createUser;
  const fillOutCompleteResetPassword = FunctionalHelpers.fillOutCompleteResetPassword;
  const fillOutResetPassword = FunctionalHelpers.fillOutResetPassword;
  const getVerificationLink = FunctionalHelpers.getVerificationLink;
  const noSuchElement = FunctionalHelpers.noSuchElement;
  const openExternalSite = FunctionalHelpers.openExternalSite;
  const openPage = FunctionalHelpers.openPage;
  const openPasswordResetLinkInDifferentBrowser = FunctionalHelpers.openPasswordResetLinkInDifferentBrowser;
  const openVerificationLinkInNewTab = FunctionalHelpers.openVerificationLinkInNewTab;
  const openVerificationLinkInSameTab = FunctionalHelpers.openVerificationLinkInSameTab;
  const testElementExists = FunctionalHelpers.testElementExists;
  const testElementValueEquals = FunctionalHelpers.testElementValueEquals;
  const testEmailExpected = FunctionalHelpers.testEmailExpected;
  const testSuccessWasShown = FunctionalHelpers.testSuccessWasShown;
  const thenify = FunctionalHelpers.thenify;
  const type = FunctionalHelpers.type;
  const visibleByQSA = FunctionalHelpers.visibleByQSA;

  const createRandomHexString = TestHelpers.createRandomHexString;

  function ensureFxaJSClient() {
    if (! client) {
      client = new FxaClient(AUTH_SERVER_ROOT, {
        xhr: nodeXMLHttpRequest.XMLHttpRequest
      });
    }
  }

  /**
   * Programatically initiate a reset password using the
   * FxA Client. Saves the token and code.
   */
  const initiateResetPassword = thenify(function(emailAddress, emailNumber) {
    ensureFxaJSClient();

    return this.parent
      .then(() => client.passwordForgotSendCode(emailAddress))
      .then(getVerificationLink(emailAddress, emailNumber))
      .then((link) => {
        // token and code are hex values
        token = link.match(/token=([a-f\d]+)/)[1];
        code = link.match(/code=([a-f\d]+)/)[1];
      });
  });

  const openCompleteResetPassword = thenify(function (email, token, code, header) {
    let url = COMPLETE_PAGE_URL_ROOT + '?';

    const queryParams = [];
    if (email) {
      queryParams.push('email=' + encodeURIComponent(email));
    }

    if (token) {
      queryParams.push('token=' + encodeURIComponent(token));
    }

    if (code) {
      queryParams.push('code=' + encodeURIComponent(code));
    }

    url += queryParams.join('&');
    return this.parent
      .then(openPage(url, header));
  });

  const testAtSettingsWithVerifiedMessage = thenify(function() {
    return this.parent
      .setFindTimeout(intern.config.pageLoadTimeout)
      .sleep(1000)

      .then(testElementExists(selectors.SETTINGS.HEADER))
      .then(testSuccessWasShown());
  });

  registerSuite({
    name: 'reset_password',

    beforeEach: function () {
      this.timeout = TIMEOUT;

      email = TestHelpers.createEmail();
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(clearBrowserState());
    },

    'visit confirmation screen without initiating reset_password, user is redirected to /reset_password': function () {
      // user is immediately redirected to /reset_password if they have no
      // sessionToken.
      // Success is showing the screen
      return this.remote
        .then(openPage(CONFIRM_PAGE_URL, selectors.RESET_PASSWORD.HEADER));
    },

    'open /reset_password page from /signin': function () {
      const updatedEmail = 'testuser@testuser.com';
      return this.remote
        .then(openPage(SIGNIN_PAGE_URL, selectors.SIGNIN.HEADER))
        .then(type(selectors.SIGNIN.EMAIL, email))
        .then(click(selectors.SIGNIN.RESET_PASSWORD))

        .then(testElementExists(selectors.RESET_PASSWORD.HEADER))
        // ensure there is a link to `Learn how Sync works`
        .then(testElementExists(selectors.RESET_PASSWORD.LINK_LEARN_HOW_SYNC_WORKS))
        // email should not be pre-filled
        .then(testElementValueEquals(selectors.RESET_PASSWORD.EMAIL, ''))
        // go back, ensure the email address is still pre-filled on the signin page.
        .then(click(selectors.RESET_PASSWORD.LINK_SIGNIN))

        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(testElementValueEquals(selectors.SIGNIN.EMAIL, email))
        .then(click(selectors.SIGNIN.RESET_PASSWORD))

        // update the email in the reset_password form, go back, ensure the
        // change is reflected in the /signin page
        .then(testElementExists(selectors.RESET_PASSWORD.HEADER))
        .then(testElementValueEquals(selectors.RESET_PASSWORD.EMAIL, ''))
        .then(type(selectors.RESET_PASSWORD.EMAIL, updatedEmail))
        .then(click(selectors.RESET_PASSWORD.LINK_SIGNIN))

        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(testElementValueEquals(selectors.SIGNIN.EMAIL, updatedEmail))
        .then(click(selectors.SIGNIN.RESET_PASSWORD))

        .then(testElementExists(selectors.RESET_PASSWORD.HEADER))
        .then(testElementValueEquals(selectors.RESET_PASSWORD.EMAIL, ''))

        .then(fillOutResetPassword(email))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER));
    },

    'enter an email with leading whitespace': function () {
      return this.remote
        .then(fillOutResetPassword('   ' + email))
        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER));
    },

    'enter an email with trailing whitespace': function () {
      return this.remote
        .then(fillOutResetPassword(email + '   '))
        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER));
    },

    'open confirm_reset_password page, click resend': function () {
      const user = TestHelpers.emailToUser(email);
      return this.remote
        .then(fillOutResetPassword(email))
        .then(click(selectors.CONFIRM_RESET_PASSWORD.LINK_RESEND))

        .then(testEmailExpected(user, 1))

        // Success is showing the success message
        .then(testSuccessWasShown())

        .then(click(selectors.CONFIRM_RESET_PASSWORD.LINK_RESEND))
        .then(click(selectors.CONFIRM_RESET_PASSWORD.LINK_RESEND))

        // Stills shows success message
        //
        // this uses .visibleByQSA instead of testSuccessWasShown because
        // the element is not re-shown, but rather should continue to
        // be visible.
        .then(visibleByQSA(selectors.CONFIRM_RESET_PASSWORD.RESEND_SUCCESS));
    },

    'open complete page with missing token shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(openCompleteResetPassword(
          email, null, code, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER
        ));
    },

    'open complete page with malformed token shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(function () {
          const malformedToken = createRandomHexString(token.length - 1);
          return openCompleteResetPassword(
            email, malformedToken, code, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER).call(this);
        });
    },

    'open complete page with invalid token shows expired screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(function () {
          const invalidToken = createRandomHexString(token.length);
          return openCompleteResetPassword(
            email, invalidToken, code, selectors.COMPLETE_RESET_PASSWORD.EXPIRED_LINK_HEADER).call(this);
        });
    },

    'open complete page with empty token shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(openCompleteResetPassword(
          email, '', code, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER
        ));
    },

    'open complete page with missing code shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(openCompleteResetPassword(
          email, token, null, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER
        ));
    },

    'open complete page with empty code shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(openCompleteResetPassword(
          email, token, '', selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER
        ));
    },

    'open complete page with malformed code shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(function () {
          const malformedCode = createRandomHexString(code.length - 1);
          return openCompleteResetPassword(
            email, token, malformedCode, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER).call(this);
        });
    },

    'open complete page with missing email shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(openCompleteResetPassword(
          null, token, code, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER
        ));
    },

    'open complete page with empty email shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(openCompleteResetPassword(
          '', token, code, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER
        ));
    },

    'open complete page with malformed email shows damaged screen': function () {
      return this.remote
        .then(initiateResetPassword(email, 0))
        .then(openCompleteResetPassword(
          'invalidemail', token, code, selectors.COMPLETE_RESET_PASSWORD.DAMAGED_LINK_HEADER
        ));
    },

    'reset password, verify same browser': function () {
      this.timeout = TIMEOUT;

      return this.remote
        .then(fillOutResetPassword(email))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))
        .then(openVerificationLinkInNewTab(email, 0))

        // Complete the reset password in the new tab
        .switchToWindow('newwindow')

        .then(testElementExists(selectors.COMPLETE_RESET_PASSWORD.HEADER))

        .then(fillOutCompleteResetPassword(PASSWORD, PASSWORD))

        // this tab's success is seeing the reset password complete header.
        .then(testAtSettingsWithVerifiedMessage())

        .then(closeCurrentWindow())

        .then(testAtSettingsWithVerifiedMessage());
    },

    'reset password, verify same browser with original tab closed': function () {
      return this.remote
        .then(fillOutResetPassword(email))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))

        // user browses to another site.
        .then(openExternalSite())
        .then(openVerificationLinkInNewTab(email, 0))

        .switchToWindow('newwindow')

        .then(fillOutCompleteResetPassword(PASSWORD, PASSWORD))

        // this tab's success is seeing the reset password complete header.
        .then(testAtSettingsWithVerifiedMessage())

        // switch to the original window
        .then(closeCurrentWindow());
    },

    'reset password, verify same browser by replacing the original tab': function () {
      this.timeout = 90 * 1000;

      return this.remote
        .then(fillOutResetPassword(email))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))

        .then(openVerificationLinkInSameTab(email, 0))
        .then(testElementExists(selectors.COMPLETE_RESET_PASSWORD.HEADER))

        .then(fillOutCompleteResetPassword(PASSWORD, PASSWORD))

        // this tab's success is seeing the reset password complete header.
        .then(testAtSettingsWithVerifiedMessage());
    },

    'reset password, verify in a different browser, from the original tab\'s P.O.V.': function () {
      this.timeout = 90 * 1000;

      return this.remote
        .then(fillOutResetPassword(email))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))

        .then(openPasswordResetLinkInDifferentBrowser(email, PASSWORD))

        // user verified in a new browser, they have to enter
        // their updated credentials in the original tab.
        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(testSuccessWasShown())
        .then(type(selectors.SIGNIN.PASSWORD, PASSWORD))
        .then(click(selectors.SIGNIN.SUBMIT))

        // no success message, the user should have seen that above.
        .then(testElementExists(selectors.SETTINGS.HEADER));
    },

    'reset password, verify in a different browser, from the new browser\'s P.O.V.': function () {
      this.timeout = 90 * 1000;
      return this.remote
        .then(fillOutResetPassword(email))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))

        // clear all browser state, simulate opening in
        // a new browser
        .then(clearBrowserState({ contentServer: true }))

        .then(openVerificationLinkInSameTab(email, 0))
        .then(testElementExists(selectors.COMPLETE_RESET_PASSWORD.HEADER))
        .then(fillOutCompleteResetPassword(PASSWORD, PASSWORD))

        .then(testAtSettingsWithVerifiedMessage());
    }
  });

  registerSuite({
    name: 'try to re-use a link',


    beforeEach: function () {
      this.timeout = TIMEOUT;
      email = TestHelpers.createEmail();

      return this.remote
          .then(createUser(email, PASSWORD, { preVerified: true }))
          .then(initiateResetPassword(email, 0))
          .then(clearBrowserState());
    },

    'complete reset, then re-open verification link, click resend': function () {
      this.timeout = TIMEOUT;

      return this.remote
        .then(openCompleteResetPassword(
          email, token, code, selectors.COMPLETE_RESET_PASSWORD.HEADER
        ))
        .then(fillOutCompleteResetPassword(PASSWORD, PASSWORD))

        .then(testElementExists(selectors.SETTINGS.HEADER))

        .then(openCompleteResetPassword(
          email, token, code, selectors.COMPLETE_RESET_PASSWORD.EXPIRED_LINK_HEADER
        ))

        .then(click(selectors.CONFIRM_RESET_PASSWORD.LINK_RESEND))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER));
    }
  });


  registerSuite({
    name: 'reset_password with email specified on URL',

    beforeEach: function () {
      email = TestHelpers.createEmail();
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(clearBrowserState());
    },

    'browse directly to page with email on query params': function () {
      const url = RESET_PAGE_URL + '?email=' + email;
      return this.remote
        .then(openPage(url, selectors.RESET_PASSWORD.HEADER))
        // email address should not be pre-filled from the query param.
        .then(testElementValueEquals(selectors.RESET_PASSWORD.EMAIL, ''))
        // ensure there is no back button when browsing directly to page
        .then(noSuchElement(selectors.RESET_PASSWORD.BACK))
        // fill in email
        .then(type(selectors.RESET_PASSWORD.EMAIL, email))
        .then(click(selectors.RESET_PASSWORD.SUBMIT))

        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER));
    }
  });


  registerSuite({
    name: 'password change while at confirm_reset_password screen',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      ensureFxaJSClient();

      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(clearBrowserState());
    },

    'original page transitions after completion': function () {
      return this.remote
        .then(fillOutResetPassword(email))
        .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))

        .then(function () {
          return client.signIn(email, PASSWORD);
        })
        .then(function (accountInfo) {
          return client.passwordChange(email, PASSWORD, 'newpassword', {
            sessionToken: accountInfo.sessionToken
          });
        })

        .then(testElementExists(selectors.SIGNIN.HEADER));
    }
  });

  registerSuite({
    name: 'reset_password with unknown email',

    beforeEach: function () {
      email = TestHelpers.createEmail();
      return this.remote
        .then(clearBrowserState());
    },

    'open /reset_password page, enter unknown email, wait for error': function () {
      return this.remote
        .then(fillOutResetPassword(email))
        // The error area shows a link to /signup
        .then(visibleByQSA(selectors.RESET_PASSWORD.ERROR))

        .then(click(selectors.RESET_PASSWORD.LINK_ERROR_SIGNUP))

        .then(testElementExists(selectors.SIGNUP.HEADER))
        // check the email address was written
        .then(testElementValueEquals(selectors.SIGNUP.EMAIL, email));
    }
  });
});

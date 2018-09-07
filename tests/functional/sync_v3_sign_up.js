/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const TestHelpers = require('../lib/helpers');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');
const uaStrings = require('./lib/ua-strings');

const config = intern._config;
const SIGNUP_PAGE_URL = `${config.fxaContentRoot}signup?context=fx_desktop_v3&service=sync`;
const ENTER_EMAIL_PAGE_URL = `${config.fxaContentRoot}?context=fx_desktop_v3&service=sync&automatedBrowser=true`;

let email;
const PASSWORD = '12345678';
const PASSWORD_WITH_TYPO = '123456789';

const {
  clearBrowserState,
  click,
  closeCurrentWindow,
  fillOutEmailFirstSignUp,
  getVerificationLink,
  getWebChannelMessageData,
  storeWebChannelMessageData,
  noPageTransition,
  noSuchElement,
  noSuchBrowserNotification,
  openPage,
  openVerificationLinkInDifferentBrowser,
  openVerificationLinkInNewTab,
  switchToWindow,
  testElementExists,
  testErrorTextInclude,
  testElementValueEquals,
  testEmailExpected,
  testIsBrowserNotified,
  type,
  visibleByQSA,
} = FunctionalHelpers;

registerSuite('Firefox Desktop Sync v3 signup', {
  beforeEach: function () {
    email = TestHelpers.createEmail();
    return this.remote.then(clearBrowserState());
  },

  afterEach: function () {
    return this.remote.then(clearBrowserState());
  },
  tests: {
    'open directly to /signup page, refresh on the /signup page': function () {
      return this.remote
      // redirected immediately to the / page
        .then(openPage(SIGNUP_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': {ok: true}
          }
        }))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER))

        .refresh()

        // refresh sends the user back to the first step
        .then(testElementExists(selectors.ENTER_EMAIL.HEADER));
    },

    'user mistypes email, enters passwords that do not match': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          webChannelResponses: {
            'fxaccounts:can_link_account': {ok: true}
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))
        .then(type(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        .then(testElementValueEquals(selectors.SIGNUP_PASSWORD.EMAIL, email))
        // user thinks they mistyped their email
        .then(click(selectors.SIGNUP_PASSWORD.LINK_MISTYPED_EMAIL, selectors.ENTER_EMAIL.HEADER))

        .then(testElementValueEquals(selectors.ENTER_EMAIL.EMAIL, email))
        .then(click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER))

        // passwords do not match should cause an error
        .then(type(selectors.SIGNUP_PASSWORD.PASSWORD, PASSWORD))
        .then(testElementExists(selectors.SIGNUP_PASSWORD.SHOW_PASSWORD))
        .then(type(selectors.SIGNUP_PASSWORD.VPASSWORD, PASSWORD_WITH_TYPO))
        .then(testElementExists(selectors.SIGNUP_PASSWORD.SHOW_VPASSWORD))
        .then(type(selectors.SIGNUP_PASSWORD.AGE, 21))
        .then(click(selectors.SIGNUP_PASSWORD.SUBMIT, selectors.SIGNUP_PASSWORD.ERROR_PASSWORDS_DO_NOT_MATCH))
        .then(testErrorTextInclude('Passwords do not match'))

        // fix the password mismatch
        .then(type(selectors.SIGNUP_PASSWORD.VPASSWORD, PASSWORD))
        .then(click(selectors.SIGNUP_PASSWORD.SUBMIT, selectors.CHOOSE_WHAT_TO_SYNC.HEADER))

        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT));
    },

    'Fx <= 57, verify at CWTS': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceAboutAccounts: true,
            forceUA: uaStrings['desktop_firefox_57']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {ok: true},
            'fxaccounts:fxa_status': {signedInUser: null},
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))

        .then(fillOutEmailFirstSignUp(email, PASSWORD))

        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(openVerificationLinkInNewTab(email, 0))
        .then(switchToWindow(1))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.SUCCESS))
        .then(noSuchElement(selectors.CONNECT_ANOTHER_DEVICE.SIGNIN_BUTTON))
        // switch back to the original window, it should transition to CAD.
        .then(closeCurrentWindow())
        // about:accounts takes over, so no screen transition
        .then(noPageTransition(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        // but the login message is sent automatically.
        .then(testIsBrowserNotified('fxaccounts:login'));
    },

    'Fx >= 58, verify at CWTS': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceAboutAccounts: true,
            forceUA: uaStrings['desktop_firefox_58']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {ok: true},
            'fxaccounts:fxa_status': {capabilities: null, signedInUser: null},
          }
        }))
        .then(visibleByQSA(selectors.ENTER_EMAIL.SUB_HEADER))

        .then(fillOutEmailFirstSignUp(email, PASSWORD))

        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(openVerificationLinkInNewTab(email, 0))
        .then(switchToWindow(1))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.SUCCESS))
        .then(noSuchElement(selectors.CONNECT_ANOTHER_DEVICE.SIGNIN_BUTTON))
        // switch back to the original window, it should transition to CAD.
        .then(closeCurrentWindow())

        // In Fx >= 58, about:accounts does not take over.
        // Expect a screen transition.
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.SUCCESS))
        // but the login message is sent automatically.
        .then(testIsBrowserNotified('fxaccounts:login'));
    },

    'Fx <= 55, verify at /confirm, same browser': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceAboutAccounts: true,
            forceUA: uaStrings['desktop_firefox_55']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {
              ok: true
            },
            'fxaccounts:fxa_status': {
              signedInUser: null
            }
          }
        }))
        .then(noSuchElement(selectors.ENTER_EMAIL.LINK_SUGGEST_SYNC))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))

        // user should be transitioned to /choose_what_to_sync
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(noSuchElement(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_ADDRESSES))
        .then(noSuchElement(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_CREDIT_CARDS))

        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(noSuchBrowserNotification('fxaccounts:login'))

        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT))

        // user should be transitioned to the "go confirm your address" page
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))

        // the login message is only sent after the sync preferences screen
        // has been cleared.
        .then(testIsBrowserNotified('fxaccounts:login'))
        // verify the user
        .then(openVerificationLinkInNewTab(email, 0))
        .then(switchToWindow(1))

        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.SUCCESS))

        .then(closeCurrentWindow())

        // We do not expect the verification poll to occur. The poll
        // will take a few seconds to complete if it erroneously occurs.
        // Add an affordance just in case the poll happens unexpectedly.
        .then(noPageTransition(selectors.CONFIRM_SIGNUP.HEADER))

        // A post-verification email should be sent, this is Sync.
        .then(testEmailExpected(email, 1));
    },

    'Fx >= 55, verify at /confirm same browser, force SMS': function () {
      let accountInfo;
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceUA: uaStrings['desktop_firefox_55']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {
              ok: true
            },
            'fxaccounts:fxa_status': {
              signedInUser: null
            }
          }
        }))
        .then(storeWebChannelMessageData('fxaccounts:login'))
        .then(noSuchElement(selectors.ENTER_EMAIL.LINK_SUGGEST_SYNC))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))

        // user should be transitioned to /choose_what_to_sync
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))

        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(noSuchBrowserNotification('fxaccounts:login'))

        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT))

        // user should be transitioned to the "go confirm your address" page
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))

        // the login message is only sent after the sync preferences screen
        // has been cleared.
        .then(testIsBrowserNotified('fxaccounts:login'))
        // verify the user
        .then(getWebChannelMessageData('fxaccounts:login'))
        .then(function (message) {
          accountInfo = message.data;
        })
        .then(getVerificationLink(email, 0))
        .then(function (verificationLink) {
          return this.parent
            .then(openPage(verificationLink, selectors.SMS_SEND.HEADER, {
              query: {
                automatedBrowser: true,
                country: 'US',
                forceExperiment: 'sendSms',
                forceExperimentGroup: 'treatment',
                forceUA: uaStrings.desktop_firefox_55
              },
              webChannelResponses: {
                'fxaccounts:can_link_account': {
                  ok: true
                },
                'fxaccounts:fxa_status': {
                  signedInUser: {
                    email: accountInfo.email,
                    sessionToken: accountInfo.sessionToken,
                    uid: accountInfo.uid,
                    verified: accountInfo.verified
                  }
                }
              }
            }));
        })
        .then(testElementExists(selectors.SMS_SEND.SUCCESS));
    },

    'Fx >= 56, engines not supported': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceUA: uaStrings['desktop_firefox_56']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {
              ok: true
            },
            'fxaccounts:fxa_status': {
              signedInUser: null
            }
          }
        }))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))

        // user should be transitioned to /choose_what_to_sync
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(noSuchElement(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_ADDRESSES))
        .then(noSuchElement(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_CREDIT_CARDS));
    },

    'Fx >= 56, neither `creditcards` nor `addresses` supported': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceUA: uaStrings['desktop_firefox_56']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {
              ok: true
            },
            'fxaccounts:fxa_status': {
              capabilities: {
                engines: []
              },
              signedInUser: null
            }
          }
        }))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))

        // user should be transitioned to /choose_what_to_sync
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(noSuchElement(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_ADDRESSES))
        .then(noSuchElement(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_CREDIT_CARDS));
    },

    'Fx >= 56, `creditcards` and `addresses` supported': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceUA: uaStrings['desktop_firefox_56']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {
              ok: true
            },
            'fxaccounts:fxa_status': {
              capabilities: {
                engines: ['creditcards', 'addresses']
              },
              signedInUser: null
            },
          }
        }))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))

        // user should be transitioned to /choose_what_to_sync
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_ADDRESSES))
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.ENGINE_CREDIT_CARDS));
    },

    'Fx <= 57, verify from original tab\'s P.O.V.': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceAboutAccounts: true,
            forceUA: uaStrings['desktop_firefox_57']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {ok: true},
            'fxaccounts:fxa_status': {capabilities: null, signedInUser: null}
          }
        }))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT))

        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(openVerificationLinkInDifferentBrowser(email))

        // about:accounts takes over, no screen transition
        .then(noPageTransition(selectors.CONFIRM_SIGNUP.HEADER));
    },

    'Fx >= 58, verify from original tab\'s P.O.V.': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
          query: {
            forceUA: uaStrings['desktop_firefox_58']
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {ok: true},
            'fxaccounts:fxa_status': {capabilities: null, signedInUser: null}
          }
        }))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))
        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(click(selectors.CHOOSE_WHAT_TO_SYNC.SUBMIT))
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))

        .then(openVerificationLinkInDifferentBrowser(email))

        // about:accounts does not take over, expect a screen transition.
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER));
    },

    'email specified by relier, not registered': function () {
      return this.remote
        .then(openPage(ENTER_EMAIL_PAGE_URL, selectors.SIGNUP_PASSWORD.HEADER, {
          query: {
            email
          },
          webChannelResponses: {
            'fxaccounts:can_link_account': {ok: true}
          }
        }))
        .then(testElementValueEquals(selectors.SIGNUP_PASSWORD.EMAIL, email))
        // user realizes it's the wrong email address.
        .then(click(selectors.SIGNUP_PASSWORD.LINK_MISTYPED_EMAIL, selectors.ENTER_EMAIL.HEADER))

        .then(testElementValueEquals(selectors.ENTER_EMAIL.EMAIL, email));
    },
  }
});

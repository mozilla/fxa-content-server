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

  const ADJUST_LINK_ANDROID =
   'https://app.adjust.com/2uo1qc?campaign=fxa-conf-page&' +
   'creative=button-autumn-2016-connect-another-device&adgroup=android';

  const ADJUST_LINK_IOS =
   'https://app.adjust.com/2uo1qc?campaign=fxa-conf-page&' +
   'creative=button-autumn-2016-connect-another-device&adgroup=ios&' +
   'fallback=https://itunes.apple.com/app/apple-store/id989804926?pt=373246&' +
   'ct=adjust_tracker&mt=8';


  const SEND_SMS_URL = `${config.fxaContentRoot}sms?service=sync&country=US`;
  const SEND_SMS_SIGNIN_CODE_URL = `${SEND_SMS_URL}&forceExperiment=sendSms&forceExperimentGroup=signinCodes`;
  const SEND_SMS_NO_QUERY_URL = `${config.fxaContentRoot}sms`;

  const TEST_PHONE_NUMBER = config.fxaTestPhoneNumber;
  const FORMATTED_TEST_PHONE_NUMBER = '916-440-0029';

  let email;
  const PASSWORD = 'password';

  const {
    click,
    closeCurrentWindow,
    deleteAllSms,
    fillOutSignUp,
    getSms,
    getSmsSigninCode,
    openPage,
    switchToWindow,
    testAttributeEquals,
    testElementExists,
    testElementTextInclude,
    testElementValueEquals,
    testHrefEquals,
    type,
  } = FunctionalHelpers;

  function testSmsSupportedCountryForm (country, expectedPrefix) {
    return function () {
      return this.remote
        .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER, {
          query: { country },
        }))
        .then(testElementValueEquals(selectors.SMS_SEND.PHONE_NUMBER, expectedPrefix))
        .then(testAttributeEquals(selectors.SMS_SEND.PHONE_NUMBER, 'data-country', country));
    };
  }

  const suite = {
    name: 'send_sms',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      // User needs a sessionToken to be able to send an SMS. Sign up,
      // no need to verify.
      return this.remote
        .then(fillOutSignUp(email, PASSWORD))
        .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
        // The phoneNumber can be reused by different tests, delete all
        // of its SMS messages to ensure a clean slate.
        .then(deleteAllSms(TEST_PHONE_NUMBER));
    },

    'with no query parameters': function () {
      return this.remote
        .then(openPage(SEND_SMS_NO_QUERY_URL, selectors.SMS_SEND.HEADER))
        .then(testElementValueEquals(selectors.SMS_SEND.PHONE_NUMBER, ''))
        .then(testAttributeEquals(selectors.SMS_SEND.PHONE_NUMBER, 'data-country', 'US'))
        .then(testHrefEquals(selectors.SMS_SEND.LINK_MARKETING_IOS, ADJUST_LINK_IOS))
        .then(testHrefEquals(selectors.SMS_SEND.LINK_MARKETING_ANDROID, ADJUST_LINK_ANDROID));
    },

    'with no service, unsupported country': function () {
      return this.remote
        .then(openPage(SEND_SMS_NO_QUERY_URL, selectors.SMS_SEND.HEADER, {
          query: {
            country: 'KZ'
          }
        }))
        // The Sync relier validates `country`, this uses the base relier
        // so country is ignored.
        .then(testElementValueEquals(selectors.SMS_SEND.PHONE_NUMBER, ''))
        .then(testAttributeEquals(selectors.SMS_SEND.PHONE_NUMBER, 'data-country', 'US'));
    },

    'with `country=AT`': testSmsSupportedCountryForm('AT', '+43'),
    'with `country=BE`': testSmsSupportedCountryForm('BE', '+32'),
    'with `country=CA`': testSmsSupportedCountryForm('CA', ''),
    'with `country=DE`': testSmsSupportedCountryForm('DE', '+49'),
    'with `country=FR`': testSmsSupportedCountryForm('FR', '+33'),
    'with `country=GB`': testSmsSupportedCountryForm('GB', '+44'),
    'with `country=LU`': testSmsSupportedCountryForm('LU', '+352'),
    'with `country=RO`': testSmsSupportedCountryForm('RO', '+40'),
    'with `country=US`': testSmsSupportedCountryForm('US', ''),

    'with an unsupported `country`': function () {
      return this.remote
        .then(openPage(SEND_SMS_URL, selectors['400'].HEADER, {
          query: {
            country: 'KZ'
          }
        }))
        .then(testElementTextInclude(selectors['400'].ERROR, 'country'));
    },

    'learn more': function () {
      return this.remote
       .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
       .then(testElementExists(selectors.SMS_SEND.LINK_MARKETING))
       .then(click(selectors.SMS_SEND.LINK_LEARN_MORE))
       .then(switchToWindow(1))

       .then(testElementExists(selectors.SMS_LEARN_MORE.HEADER))
       .then(closeCurrentWindow());

    },

    'why is this required': function () {
      return this.remote
       .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
       .then(click(selectors.SMS_SEND.LINK_WHY_IS_THIS_REQUIRED))

       .then(testElementExists(selectors.SMS_WHY_IS_THIS_REQUIRED.HEADER))
       .then(click(selectors.SMS_WHY_IS_THIS_REQUIRED.CLOSE))

       .then(testElementExists(selectors.SMS_SEND.HEADER));
    },

    'empty phone number': function () {
      return this.remote
       .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
       .then(click(selectors.SMS_SEND.SUBMIT))
       .then(testElementExists(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP))
       .then(testElementTextInclude(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP, 'required'));
    },

    'invalid phone number (too short)': function () {
      return this.remote
        .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
        .then(type(selectors.SMS_SEND.PHONE_NUMBER, '2134567'))
        .then(click(selectors.SMS_SEND.SUBMIT))
        .then(testElementExists(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP))
        .then(testElementTextInclude(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP, 'invalid'));
    },

    'invalid phone number (too long)': function () {
      return this.remote
        .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
        .then(type(selectors.SMS_SEND.PHONE_NUMBER, '21345678901'))
        .then(click(selectors.SMS_SEND.SUBMIT))
        .then(testElementExists(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP))
        .then(testElementTextInclude(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP, 'invalid'));
    },

    'invalid phone number (contains letters)': function () {
      return this.remote
       .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
       .then(type(selectors.SMS_SEND.PHONE_NUMBER, '2134567a890'))
       .then(click(selectors.SMS_SEND.SUBMIT))
       .then(testElementExists(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP))
       .then(testElementTextInclude(selectors.SMS_SEND.PHONE_NUMBER_TOOLTIP, 'invalid'));
    },

    'valid phone number, back': function () {
      return this.remote
       .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
       .then(type(selectors.SMS_SEND.PHONE_NUMBER, TEST_PHONE_NUMBER))
       .then(click(selectors.SMS_SEND.SUBMIT))
       .then(testElementExists(selectors.SMS_SENT.HEADER))
       .then(testElementTextInclude(selectors.SMS_SENT.PHONE_NUMBER_SENT_TO, FORMATTED_TEST_PHONE_NUMBER))
       .then(testElementExists(selectors.SMS_SEND.LINK_MARKETING))
       .then(getSms(TEST_PHONE_NUMBER, 0))

       // user realizes they made a mistake
       .then(click(selectors.SMS_SENT.LINK_BACK))
       .then(testElementExists(selectors.SMS_SEND.HEADER))

       // original phone number should still be in place
       .then(testElementValueEquals(selectors.SMS_SEND.PHONE_NUMBER, TEST_PHONE_NUMBER));
    },

    'valid phone number, resend': function () {
      return this.remote
       .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
       .then(type(selectors.SMS_SEND.PHONE_NUMBER, TEST_PHONE_NUMBER))
       .then(click(selectors.SMS_SEND.SUBMIT))
       .then(testElementExists(selectors.SMS_SENT.HEADER))
       .then(getSms(TEST_PHONE_NUMBER, 0))

       .then(click(selectors.SMS_SENT.LINK_RESEND))
       .then(testElementTextInclude(selectors.SMS_SENT.PHONE_NUMBER_SENT_TO, FORMATTED_TEST_PHONE_NUMBER))
       .then(getSms(TEST_PHONE_NUMBER, 1))

       // user realizes they made a mistake
       .then(click(selectors.SMS_SENT.LINK_BACK))
       .then(testElementExists(selectors.SMS_SEND.HEADER))

       // original phone number should still be in place
       .then(testElementValueEquals(selectors.SMS_SEND.PHONE_NUMBER, TEST_PHONE_NUMBER));
    },

    'valid phone number, enable signinCode': function () {
      return this.remote
       .then(openPage(SEND_SMS_SIGNIN_CODE_URL, selectors.SMS_SEND.HEADER))
       .then(type(selectors.SMS_SEND.PHONE_NUMBER, TEST_PHONE_NUMBER))
       .then(click(selectors.SMS_SEND.SUBMIT))
       .then(testElementExists(selectors.SMS_SENT.HEADER))
       .then(getSmsSigninCode(TEST_PHONE_NUMBER, 0));
    },

    'valid phone number w/ country code of 1': function () {
      return this.remote
        .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
        .then(type(selectors.SMS_SEND.PHONE_NUMBER, `1${TEST_PHONE_NUMBER}`))
        .then(click(selectors.SMS_SEND.SUBMIT))
        .then(testElementExists(selectors.SMS_SENT.HEADER))
        .then(testElementTextInclude(selectors.SMS_SENT.PHONE_NUMBER_SENT_TO, FORMATTED_TEST_PHONE_NUMBER))
        .then(testElementExists(selectors.SMS_SEND.LINK_MARKETING))
        .then(getSms(TEST_PHONE_NUMBER, 0));
    },

    'valid phone number w/ country code of +1': function () {
      return this.remote
        .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
        .then(type(selectors.SMS_SEND.PHONE_NUMBER, `+1${TEST_PHONE_NUMBER}`))
        .then(click(selectors.SMS_SEND.SUBMIT))
        .then(testElementExists(selectors.SMS_SENT.HEADER))
        .then(testElementTextInclude(selectors.SMS_SENT.PHONE_NUMBER_SENT_TO, FORMATTED_TEST_PHONE_NUMBER))
        .then(testElementExists(selectors.SMS_SEND.LINK_MARKETING))
        .then(getSms(TEST_PHONE_NUMBER, 0));
    },

    'valid phone number (contains spaces and punctuation)': function () {
      const unformattedTestPhoneNumber = ` ${TEST_PHONE_NUMBER.slice(0,3)} .,- ${TEST_PHONE_NUMBER.slice(3)} `;
      return this.remote
       .then(openPage(SEND_SMS_URL, selectors.SMS_SEND.HEADER))
       .then(type(selectors.SMS_SEND.PHONE_NUMBER, unformattedTestPhoneNumber))
       .then(click(selectors.SMS_SEND.SUBMIT))
       .then(testElementExists(selectors.SMS_SENT.HEADER))
       .then(testElementTextInclude(selectors.SMS_SENT.PHONE_NUMBER_SENT_TO, FORMATTED_TEST_PHONE_NUMBER))
       .then(getSms(TEST_PHONE_NUMBER, 0))

       // user realizes they made a mistake
       .then(click(selectors.SMS_SENT.LINK_BACK))
       .then(testElementExists(selectors.SMS_SEND.HEADER))

       // original phone number should still be in place
       .then(testElementValueEquals(selectors.SMS_SEND.PHONE_NUMBER, unformattedTestPhoneNumber));
    }
  };

  registerSuite(suite);
});

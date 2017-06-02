/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Define selectors on a per-screen basis.
 */
define([], function () {
  /*eslint-disable max-len*/
  return {
    CONFIRM_SIGNIN: {
      HEADER: '#fxa-confirm-signin-header'
    },
    CONFIRM_SIGNUP: {
      HEADER: '#fxa-confirm-header'
    },
    FORCE_AUTH: {
      EMAIL: 'input[type=email]',
      HEADER: '#fxa-force-auth-header'
    },
    SETTINGS: {
      HEADER: '#fxa-settings-header',
      PROFILE_HEADER: '#fxa-settings-profile-header .card-header',
      PROFILE_SUB_HEADER: '#fxa-settings-profile-header .card-subheader'
    },
    SIGNIN: {
      EMAIL: 'input[type=email]',
      EMAIL_NOT_EDITABLE: '.prefillEmail',
      HEADER: '#fxa-signin-header',
      PASSWORD: 'input[type=password]'
    },
    SIGNUP: {
      EMAIL: 'input[type=email]',
      HEADER: '#fxa-signup-header',
      LINK_SIGN_IN: 'a#have-account'
    },
    SMS_SEND: {
      HEADER: '#fxa-send-sms-header',
      PHONE_NUMBER: 'input[type="tel"]',
      SUBMIT: 'button[type="submit"]'
    },
    SMS_SENT: {
      HEADER: '#fxa-sms-sent-header'
    }
  };
  /*eslint-enable max-len*/
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const TestHelpers = require('../lib/helpers');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');

const config = intern._config;
const PAGE_URL = `${config.fxaContentRoot}?context=fx_firstrun_v2&service=sync&action=email`; //eslint-disable-line max-len

let email;

const {
  clearBrowserState,
  click,
  openPage,
  testElementExists,
  type,
} = FunctionalHelpers;

registerSuite('password repeat balloon', {
  beforeEach: function () {
    email = TestHelpers.createEmail('sync{id}');

    return this.remote
      .then(clearBrowserState({ force: true }))
      .then(openPage(PAGE_URL, selectors.ENTER_EMAIL.HEADER, {
        webChannelResponses: {
          'fxaccounts:can_link_account': {ok: true}
        }
      }))
      .then(type(selectors.ENTER_EMAIL.EMAIL, email))
      .then(click(selectors.ENTER_EMAIL.SUBMIT, selectors.SIGNUP_PASSWORD.HEADER));
  },

  tests: {
    'appears on repeat field focused': function () {
      return this.remote
        .then(click(selectors.SIGNUP_PASSWORD.PASSWORD))
        .then(click(selectors.SIGNUP_PASSWORD.VPASSWORD))
        .then(testElementExists(selectors.SIGNUP_PASSWORD.VPASSWORD_BALLOON.BALLOON))
        .findByCssSelector(selectors.SIGNUP_PASSWORD.VPASSWORD_BALLOON.BALLOON)
        .then(el => el.getAttribute('style'))
        .then(style => assert.include(style, 'opacity: 1'));
    },
    'disappears on repeat field blur': function () {
      return this.remote
        .then(click(selectors.SIGNUP_PASSWORD.VPASSWORD))
        .then(click(selectors.SIGNUP_PASSWORD.AGE))
        .then(testElementExists(selectors.SIGNUP_PASSWORD.VPASSWORD_BALLOON.BALLOON))
        .findByCssSelector(selectors.SIGNUP_PASSWORD.VPASSWORD_BALLOON.BALLOON)
        .then(el => el.getAttribute('style'))
        .then(style => assert.include(style, 'opacity: 0'));
    },
  }
});


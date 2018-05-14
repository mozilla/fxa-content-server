/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');
var config = intern._config;
var SIGNIN_PAGE_URL = `${config.fxaContentRoot}signin?context=fx_desktop_v1&service=sync`;
var SIGNUP_PAGE_URL = `${config.fxaContentRoot}signup?context=fx_desktop_v1&service=sync`;

const {
  openPage,
} = FunctionalHelpers;

registerSuite('Fx Desktop Sync v1', {
  tests: {
    'signin': function () {
      return this.remote
        .then(openPage(SIGNIN_PAGE_URL, selectors.UPDATE_FIREFOX.HEADER));
    },

    'signup': function () {
      return this.remote
        .then(openPage(SIGNUP_PAGE_URL, selectors.UPDATE_FIREFOX.HEADER));
    }
  }
});

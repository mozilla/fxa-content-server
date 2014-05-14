/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  './intern'
], function (intern) {
  'use strict';

  intern.proxyPort = 8090;
  intern.proxyUrl = 'http://127.0.0.1:8090/';
  intern.useSauceConnect = false;
  intern.webdriver.port = 4444;

  intern.environments = [
    { browserName: 'firefox' }
  ];

  intern.functionalSuites = [ 'tests/functional/mocha' ];

  return intern;
});

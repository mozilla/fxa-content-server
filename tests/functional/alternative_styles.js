/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const intern = require('intern');
const registerSuite = require('intern!object');
const FunctionalHelpers = require('tests/functional/lib/helpers');
const require = require('require');
var INVALID_CHROMELESS_URL = intern.config.fxaContentRoot + 'signup?style=chromeless';
var CHROMELESS_IFRAME_SYNC_URL = intern.config.fxaContentRoot + 'signup?service=sync&context=iframe&style=chromeless';

var noSuchElement = FunctionalHelpers.noSuchElement;

registerSuite('alternate styles', {
  beforeEach: function () {
    return this.remote.then(FunctionalHelpers.clearBrowserState());
  },

  'the `chromeless` style is not applied if not iframed sync': function () {

    return this.remote
      .get(require.toUrl(INVALID_CHROMELESS_URL))
      .setFindTimeout(intern.config.pageLoadTimeout)
      .findByCssSelector('#fxa-signup-header')
      .end()

      .then(noSuchElement('.chromeless'))

      .end();
  },

  'the `chromeless` style can be applied to an iframed sync': function () {

    return this.remote
      .get(require.toUrl(CHROMELESS_IFRAME_SYNC_URL))
      .setFindTimeout(intern.config.pageLoadTimeout)
      .findByCssSelector('#fxa-signup-header')
      .end()

      .findByCssSelector('.chromeless')
      .end();
  }
});

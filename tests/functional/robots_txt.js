/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'tests/functional/lib/helpers'
], function (intern, registerSuite, assert, FunctionalHelpers) {
  'use strict';

  var url = intern.config.fxaContentRoot + 'robots.txt';
  var toUrl = FunctionalHelpers.toUrl;

  registerSuite({
    name: 'robots.txt',

    'should disallow root': function () {

      return this.get('remote')
        .get(toUrl(url))
        .setFindTimeout(intern.config.pageLoadTimeout)
        .findByTagName('body')
        .getVisibleText()
        .then(function (source) {
          assert.isTrue(/Disallow: \//g.test(source));
        })
        .end();
    }

  });
});

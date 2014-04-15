/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'chai',
  'jquery',
  'lib/progress'
],
function (chai, $, progress) {
  /*global describe, beforeEach, afterEach, it*/
  var assert = chai.assert;

  describe('lib/progress', function () {
    beforeEach(function () {
      progress.testReset();
    });

    describe('start', function () {
      it('shows the indicator', function () {
        progress.start();
        assert.isTrue(progress.isVisible());
        assert.ok($('#nprogress').length);
      });
    });

    describe('done', function () {
      it('hides the indicator', function () {
        progress.start();
        progress.done();
        assert.isFalse(progress.isVisible());
      });
    });

    describe('multiple starts', function () {
      it('must be matched by same number of dones', function () {
        progress.start();
        progress.start();
        progress.done();
        assert.isTrue(progress.isVisible());

        progress.done();
        assert.isFalse(progress.isVisible());
      });
    });
  });
});


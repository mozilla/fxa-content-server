/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'cocktail',
  'sinon',
  'views/mixins/password-strength-mixin',
  'views/base'
], function (chai, Cocktail, sinon, PasswordStrengthMixin, BaseView) {
  'use strict';

  var assert = chai.assert;

  describe('views/mixins/password-strength-mixin', function () {
    // has a dot at the end
    var EVENT_NAME_PREFIX = 'experiment.pw-strength.';
    var view;
    var View = BaseView.extend({
      // nothing to extend
    });
    Cocktail.mixin(View, PasswordStrengthMixin);

    beforeEach(function () {
      view = new View();
      sinon.spy(view, 'logScreenEvent');
    });

    it('logs PASSWORD_TOO_SHORT when password is short', function () {
      return view.checkPasswordStrength('hello')
        .then(function () {
          assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'PASSWORD_TOO_SHORT'));
        });
    });

    it('logs MISSING_PASSWORD when no password is passed', function () {
      return view.checkPasswordStrength('')
        .then(function () {
          assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'MISSING_PASSWORD'));
        });
    });

    it('logs ALL_NUMBERS_LETTERS when password is all numbers', function () {
      return view.checkPasswordStrength('123456789')
        .then(function () {
          assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'ALL_NUMBERS_LETTERS'));
        });
    });

    it('logs ALL_NUMBERS_LETTERS when password is all letters', function () {
      return view.checkPasswordStrength('dragondrag')
        .then(function () {
          assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'ALL_NUMBERS_LETTERS'));
        });
    });

    it('logs BLOOMFILTER_MISS when password is not in Bloom Filter', function () {
      return view.checkPasswordStrength('imsuperlongandstrong')
        .then(function () {
          assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'BLOOMFILTER_MISS'));
        });
    });

    it('logs BLOOMFILTER_HIT when password is in Bloom Filter', function () {
      return view.checkPasswordStrength('charlie2')
        .then(function () {
          assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'BLOOMFILTER_HIT'));
        });
    });

  });
});

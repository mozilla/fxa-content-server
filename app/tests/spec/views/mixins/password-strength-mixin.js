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
    var EVENT_NAME_PREFIX = 'experiment.pw_strength.';
    var view;
    var View = BaseView.extend({
      // nothing to extend
    });

    Cocktail.mixin(
      View,
      PasswordStrengthMixin
    );

    describe('_isPasswordStengthCheckEnabled', function () {
      it('calls able to make the choice', function () {
        var ableMock = {
          choose: sinon.spy(function () {
            return true;
          })
        };

        view = new View({
          able: ableMock,
          metrics: {
            isCollectionEnabled: function () {
              return true;
            },
            logEvent: sinon.spy(function () {
              return true;
            })
          },
          user: {
            get: function () {
              return 'userid';
            }
          },
          window: {
            location: {
              search: '?passwordStrengthCheck=true'
            }
          }
        });

        assert.isTrue(view._isPasswordStrengthCheckEnabled());
        assert.isTrue(
          ableMock.choose.calledWith('passwordStrengthCheckEnabled', {
            isMetricsEnabledValue: true,
            uniqueUserId: 'userid',
            forcePasswordStrengthCheck: 'true'
          })
        );
      });
    });

    describe('disabled', function () {
      it('does not attempt to check password', function () {
        view = new View();
        sinon.spy(view, 'logScreenEvent');

        sinon.stub(view, '_isPasswordStrengthCheckEnabled', function () {
          return false;
        });

        sinon.spy(view, '_getPasswordStrengthChecker');
        return view.checkPasswordStrength('password')
          .then(function (status) {
            assert.equal(status, 'DISABLED');
            assert.isFalse(view._getPasswordStrengthChecker.called);
          });
      });
    });

    describe('enabled', function () {
      beforeEach(function () {
        view = new View();
        sinon.spy(view, 'logScreenEvent');
        sinon.stub(view, '_isPasswordStrengthCheckEnabled', function () {
          return true;
        });
      });

      it('logs password_too_short when password is short', function () {
        return view.checkPasswordStrength('hello')
          .then(function () {
            assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'password_too_short'));
          });
      });

      it('logs missing_password when no password is passed', function () {
        return view.checkPasswordStrength('')
          .then(function () {
            assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'missing_password'));
          });
      });

      it('logs all_numbers_letters when password is all numbers', function () {
        return view.checkPasswordStrength('123456789')
          .then(function () {
            assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'not_strong_enough'));
          });
      });

      it('logs all_numbers_letters when password is all letters', function () {
        return view.checkPasswordStrength('dragondrag')
          .then(function () {
            assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'not_strong_enough'));
          });
      });

      it('logs bloomfilter_miss when password is not in Bloom Filter', function () {
        return view.checkPasswordStrength('imsuperlongandstrong')
          .then(function () {
            assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'success'));
          });
      });

      it('logs bloomfilter_hit when password is in Bloom Filter', function () {
        return view.checkPasswordStrength('charlie2')
          .then(function () {
            assert.isTrue(view.logScreenEvent.calledWith(EVENT_NAME_PREFIX + 'bloomfilter_hit'));
          });
      });
    });

  });
});

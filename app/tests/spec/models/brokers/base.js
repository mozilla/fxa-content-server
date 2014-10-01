/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'chai',
  'sinon',
  'models/brokers/base',
  'views/base',
  '../../../mocks/window'
],
function (chai, sinon, Broker, BaseView, WindowMock) {
  var assert = chai.assert;

  describe('models/brokers/base', function () {
    var broker;
    var view;
    var windowMock;

    beforeEach(function () {
      view = new BaseView();
      windowMock = new WindowMock();
      broker = new Broker({
        window: windowMock
      });
    });

    describe('checkSupport', function () {
      it('returns a promise', function () {
        return broker.checkSupport()
          .then(assert.pass);
      });
    });

    describe('shouldReadyScreenAutoSubmit', function () {
      it('returns false', function () {
        assert.isFalse(broker.shouldReadyScreenAutoSubmit());
      });
    });

    describe('afterSignIn', function () {
      it('returns a promise', function () {
        return broker.afterSignIn(view)
          .then(assert.pass);
      });
    });

    describe('beforeSignUpConfirmed', function () {
      it('returns a promise', function () {
        return broker.beforeSignUpConfirmed(view)
          .then(assert.pass);
      });
    });

    describe('afterSignUpConfirmed', function () {
      it('returns a promise', function () {
        return broker.afterSignUpConfirmed(view)
          .then(assert.pass);
      });
    });

    describe('afterSignUpVerified', function () {
      it('returns a promise', function () {
        return broker.afterSignUpVerified(view)
          .then(assert.pass);
      });
    });

    describe('beforeResetPasswordConfirmed', function () {
      it('returns a promise', function () {
        return broker.beforeResetPasswordConfirmed(view)
          .then(assert.pass);
      });
    });

    describe('afterResetPasswordConfirmed', function () {
      it('returns a promise', function () {
        return broker.afterResetPasswordConfirmed(view)
          .then(assert.pass);
      });
    });

    describe('afterResetPasswordVerified', function () {
      it('returns a promise', function () {
        return broker.afterResetPasswordVerified(view)
          .then(assert.pass);
      });
    });

    describe('transformLink', function () {
      it('does nothing to the link', function () {
        assert.equal(broker.transformLink('signin'), 'signin');
      });
    });

    describe('isForceAuth', function () {
      it('returns `false` by default', function () {
        assert.isFalse(broker.isForceAuth());
      });

      it('returns `true` if flow began at `/force_auth`', function () {
        windowMock.location.pathname = '/force_auth';
        return broker.fetch()
          .then(function () {
            assert.isTrue(broker.isForceAuth());
          });
      });
    });
  });
});



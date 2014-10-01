/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'chai',
  'sinon',
  'models/brokers/default',
  'views/base',
  '../../../mocks/window'
],
function (chai, sinon, Broker, View, WindowMock) {
  var assert = chai.assert;

  describe('models/brokers/default', function () {
    var broker;
    var windowMock;
    var view;

    beforeEach(function () {
      windowMock = new WindowMock();

      broker = new Broker({
        window: windowMock
      });

      view = new View();
    });

    describe('afterSignIn', function () {
      it('redirects to the settings page', function () {
        sinon.stub(view, 'navigate', function () {
        });

        return broker.afterSignIn(view)
          .then(function () {
            assert.isTrue(view.navigate.calledWith('settings'));
          });
      });
    });

    describe('afterSignUpConfirmed', function () {
      it('redirects to the signup_complete page', function () {
        sinon.stub(view, 'navigate', function () {
        });

        return broker.afterSignUpConfirmed(view)
          .then(function () {
            assert.isTrue(view.navigate.calledWith('signup_complete'));
          });
      });
    });

    describe('afterSignUpVerified', function () {
      it('redirects to the signup_complete page', function () {
        sinon.stub(view, 'navigate', function () {
        });

        return broker.afterSignUpVerified(view)
          .then(function () {
            assert.isTrue(view.navigate.calledWith('signup_complete'));
          });
      });
    });

    describe('afterResetPasswordConfirmed', function () {
      it('redirects to the reset_password_complete page', function () {
        sinon.stub(view, 'navigate', function () {
        });

        return broker.afterResetPasswordConfirmed(view)
          .then(function () {
            assert.isTrue(view.navigate.calledWith('reset_password_complete'));
          });
      });
    });

    describe('afterResetPasswordVerified', function () {
      it('redirects to the reset_password_complete page', function () {
        sinon.stub(view, 'navigate', function () {
        });

        return broker.afterResetPasswordVerified(view)
          .then(function () {
            assert.isTrue(view.navigate.calledWith('reset_password_complete'));
          });
      });
    });
  });
});



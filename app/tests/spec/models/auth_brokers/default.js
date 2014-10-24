/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'chai',
  'sinon',
  'models/auth_brokers/default',
  'views/base',
  '../../../mocks/window'
],
function (chai, sinon, DefaultAuthenticationBroker, View, WindowMock) {
  var assert = chai.assert;

  describe('models/auth_brokers/default', function () {
    var broker;
    var windowMock;
    var view;

    beforeEach(function () {
      windowMock = new WindowMock();

      broker = new DefaultAuthenticationBroker({
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

    describe('afterSignUpConfirmationPoll', function () {
      it('redirects to the signup_complete page', function () {
        sinon.stub(view, 'navigate', function () {
        });

        return broker.afterSignUpConfirmationPoll(view)
          .then(function () {
            assert.isTrue(view.navigate.calledWith('signup_complete'));
          });
      });
    });

    describe('afterResetPasswordConfirmationPoll', function () {
      it('redirects to the reset_password_complete page', function () {
        sinon.stub(view, 'navigate', function () {
        });

        return broker.afterResetPasswordConfirmationPoll(view)
          .then(function () {
            assert.isTrue(view.navigate.calledWith('reset_password_complete'));
          });
      });
    });
  });
});



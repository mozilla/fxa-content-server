/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const sinon = require('sinon');
  const BaseBroker = require('models/auth_brokers/base');
  const WebBroker = require('models/auth_brokers/web');

  const defaultBehaviors = BaseBroker.prototype.defaultBehaviors;

  describe('models/auth_brokers/web', function () {
    let broker;

    beforeEach(() => {
      broker = new WebBroker({ metrics: { logEvent: sinon.spy() }});
    });

    function testRedirectsToSettings(brokerMethod) {
      describe(brokerMethod, () => {
        it('returns a NavigateBehavior to settings', () => {
          return broker[brokerMethod]({ get: () => {} })
            .then((behavior) => {
              assert.equal(behavior.type, 'navigate');
              assert.equal(behavior.endpoint, 'settings');
            });
        });
      });
    }

    function testRedirectsToSettingsIfSignedIn(brokerMethod) {
      it(`${brokerMethod} redirects to settings if signed in, default behavior otw`, () => {
        return broker[brokerMethod]({ get: () => {} })
          .then((behavior) => {
            assert.equal(behavior.type, 'session-ternary');

            assert.equal(behavior.signedInBehavior.type, 'navigate');
            assert.equal(behavior.signedInBehavior.endpoint, 'settings');

            assert.strictEqual(behavior.signedOutBehavior, defaultBehaviors[brokerMethod]);
          });
      });
    }

    testRedirectsToSettings('afterCompleteResetPassword');
    testRedirectsToSettings('afterResetPasswordConfirmationPoll');
    testRedirectsToSettings('afterSignInConfirmationPoll');
    testRedirectsToSettings('afterSignUpConfirmationPoll');

    testRedirectsToSettingsIfSignedIn('afterCompleteAddSecondaryEmail');
    testRedirectsToSettingsIfSignedIn('afterCompleteSignIn');
    testRedirectsToSettingsIfSignedIn('afterCompleteSignUp');
  });
});



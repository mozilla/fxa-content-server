/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Account = require('models/account');
  const { assert } = require('chai');
  const NavigateBehavior = require('views/behaviors/navigate');
  const p = require('lib/promise');
  const SessionTernaryBehavior = require('views/behaviors/session-ternary');
  const sinon = require('sinon');

  describe('views/behaviors/session-ternary', () => {
    let sessionTernaryBehavior;
    let signedInBehavior;
    let signedOutBehavior;

    before (() => {
      signedInBehavior = new NavigateBehavior('settings');
      signedOutBehavior = new NavigateBehavior('signin');
      sessionTernaryBehavior = new SessionTernaryBehavior(signedInBehavior, signedOutBehavior);
    });

    describe('account is signed in', () => {
      it('returns the `signedInBehavior`', () => {
        const account = new Account({});
        sinon.stub(account, 'isSignedIn', () => p(true));

        return sessionTernaryBehavior({}, account)
          .then((behavior) => {
            assert.strictEqual(behavior, signedInBehavior);
          });
      });
    });

    describe('account is not signed in', () => {
      it('returns the `signedOutBehavior`', () => {
        const account = new Account({});
        sinon.stub(account, 'isSignedIn', () => p(false));

        return sessionTernaryBehavior({}, account)
          .then((behavior) => {
            assert.strictEqual(behavior, signedOutBehavior);
          });
      });
    });
  });
});

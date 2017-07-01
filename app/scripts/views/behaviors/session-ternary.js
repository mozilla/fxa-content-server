/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Behavior that returns `signedInBehavior` if the
 * account is signed in, and `signedOutBehavior` otherwise.
 */

define(function (require, exports, module) {
  'use strict';

  /**
   * Invoke `signedInBehavior` if the account is signed in,
   * and `signedOutBehavior` otherwise.
   *
   * @param {Function} signedInBehavior
   * @param {Function} signedOutBehavior
   * @returns {Function}
   */
  module.exports = function (signedInBehavior, signedOutBehavior) {
    const behavior = (view, account) => {
      return account.isSignedIn()
        .then((isSignedIn) => {
          return isSignedIn ? signedInBehavior : signedOutBehavior;
        });
    };

    // properties exposed for testing
    behavior.type = 'session-ternary';
    behavior.signedInBehavior = signedInBehavior;
    behavior.signedOutBehavior = signedOutBehavior;

    return behavior;
  };
});

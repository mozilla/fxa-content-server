/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Helper methods to determine what is the method of verification
 *
 * @class VerificationMethodMixin
 */

define(function (require, exports, module) {
  'use strict';

  const VerificationMethods = require('lib/verification-methods');

  module.exports = {
    initialize () {
      if (! this._account.has('verificationMethod')) {
        this._account.set('verificationMethod', VerificationMethods.EMAIL);
      }
    },
    /**
     * Check if verification method is email
     *
     * @returns {Boolean}
     */
    isEmail () {
      return this._account.get('verificationMethod') === VerificationMethods.EMAIL;
    },

    /**
     * Check if verification method is push notification
     *
     * @returns {Boolean}
     */
    isPush () {
      return this._account.get('verificationMethod') === VerificationMethods.PUSH;
    }
  };
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/promise',
  'lib/runtime-require'
], function (p, runtimeRequire) {
  'use strict';

  var PasswordStrengthMixin = {
    _getPasswordStrengthChecker: function () {
      // returns a promise that resolves once the library is loaded.
      var self = this;
      if (! self._passwordStrengthCheckerPromise) {
        self._passwordStrengthCheckerPromise = runtimeRequire('passwordcheck')
          .then(function (PasswordCheck) {
            return new PasswordCheck();
          });
      }
      return self._passwordStrengthCheckerPromise;
    },
    /**
     * Check the password strength. Returns a promise that resolves
     * when the check is complete.
     *
     * Usage:
     *
     *   view.checkPasswordStrength(password)
     *     .then(function (status) {
     *      // do something with the status
     *     });
     *
     * @method checkPasswordStrength
     * @returns {Promise}
     */
    checkPasswordStrength: function (password) {
      var self = this;
      return this._getPasswordStrengthChecker()
        .then(function (passwordStrengthChecker) {
          var deferred = p.defer();
          passwordStrengthChecker(password, function (passwordCheckStatus) {
            // in the future, do some fancy tooltip here.
            self.logScreenEvent('experiment.pw-strength.' + passwordCheckStatus);
            console.log('experiment.pw-strength.' + passwordCheckStatus);
            deferred.resolve(passwordCheckStatus);
          });
          return deferred.promise;
        });
    }
  };
  return PasswordStrengthMixin;
});

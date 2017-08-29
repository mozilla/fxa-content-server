/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Complete2FATemplate = require('stache!templates/complete_2fa');
  const AuthErrors = require('lib/auth-errors');
  const FormView = require('views/form');
  const VerificationInfo = require('models/verification/complete-2fa');

  const Complete2FAView = FormView.extend({
    template: Complete2FATemplate,

    initialize (options = {}) {
      this._verificationInfo = new VerificationInfo(this.getSearchParams());
      const uid = this._verificationInfo.get('uid');

      const account = options.account || this.user.getAccountByUid(uid);

      if (account.isDefault()) {
        account.set('uid', uid);
      }

      this._account = account;
    },

    getAccount () {
      return this._account;
    },

    beforeRender () {
      const verificationInfo = this._verificationInfo;
      if (! verificationInfo.isValid()) {
        // error message before doing any more checks.
        this.logError(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
        return true;
      }
    },

    submit () {
      const account = this.getAccount();
      const code = this._verificationInfo.get('code');
      const options = {
        service: this.relier.get('service') || null,
        type: this._verificationInfo.get('type') || null
      };
      return this.user.completeAccountSignUp(account, code, options)
        .fail((err) => this._logAndAbsorbMarketingClientErrors(err))
        .then(() => {
          this.navigate('signin_verified');
          this._notifyBrokerAndComplete(account);
        });
    },

    setInitialContext (context) {
      //Need to add location, time etc.
    }
  });

  module.exports = Complete2FAView;
});

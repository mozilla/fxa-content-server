/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const AuthErrors = require('lib/auth-errors');
  const BaseView = require('views/base');
  const Cocktail = require('cocktail');
  const SignInMixin = require('views/mixins/signin-mixin');
  const Template = require('stache!templates/complete_signin_authorization');
  const t = BaseView.t;
  const Url = require('lib/url');
  const VerificationInfo = require('models/verification/signin-authorization');

  const View = BaseView.extend({
    template: Template,
    className: 'complete-signin-authorization',

    initialize (options = {}) {
      const searchParams = Url.searchParams(this.window.location.search);
      this._verificationInfo = new VerificationInfo(searchParams);
    },

    beforeRender () {
      const verificationInfo = this._verificationInfo;
      /*
      if (! verificationInfo.isValid()) {
        // One or more parameters fails validation. Abort and show an
        // error message before doing any more checks.
        this.logError(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
        return true;
      }
      */

      const account = this.user.initAccount(
        verificationInfo.pick('email', 'uid')
      );

      return account.verifyLoginAuthorizationCode(
        verificationInfo.get('code')
      )
      .then(() => {
        this.navigate('signin', {
          email: account.get('email'),
          success: t('Authorization successful, please sign in again.')
        });

        return false;
      });

    },

    context () {
      return {
        email: this._verificationInfo.get('email')
      };
    }
  });

  Cocktail.mixin(
    View,
    SignInMixin
  );

  module.exports = View;
});

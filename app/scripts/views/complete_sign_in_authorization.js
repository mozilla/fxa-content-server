/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const AuthErrors = require('lib/auth-errors');
  const BaseView = require('views/base');
  const Cocktail = require('cocktail');
  const SignInMixin = require('views/mixins/signin-mixin');
  const Template = require('stache!templates/complete_sign_in_authorization');
  const t = BaseView.t;
  const Url = require('lib/url');
  const VerificationInfo = require('models/verification/sign-in-authorization');

  const View = BaseView.extend({
    template: Template,
    className: 'complete-signin-authorization',

    initialize (options = {}) {
      const searchParams = Url.searchParams(this.window.location.search);
      this._verificationInfo = new VerificationInfo(searchParams);
    },

    beforeRender () {
      const verificationInfo = this._verificationInfo;
      if (! verificationInfo.isValid()) {
        // One or more parameters fails validation. Abort and show an
        // error message before doing any more checks.
        this.logError(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
        return;
      }

      const account = this.user.initAccount(
        verificationInfo.pick('email', 'uid')
      );

      return account.verifyLoginAuthorizationCode(verificationInfo.get('code'))
        .then(() => {
          this.navigate('signin', {
            email: account.get('email'),
            success: t('Authorization successful, please sign in again.')
          });

          return false;
        }, (err) => {
          // TODO check for damaged and expired verification links
        });
    },

    context () {
      const verificationInfo = this._verificationInfo;

      return {
        email: verificationInfo.get('email'),
        isLinkDamaged: ! verificationInfo.isValid(),
        isLinkExpired: verificationInfo.isExpired()
      };
    }
  });

  Cocktail.mixin(
    View,
    SignInMixin
  );

  module.exports = View;
});

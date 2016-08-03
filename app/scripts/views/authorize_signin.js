/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const BackMixin = require('views/mixins/back-mixin');
  const Cocktail = require('cocktail');
  const Constants = require('lib/constants');
  const FormView = require('views/form');
  const Template = require('stache!templates/authorize_signin');
  const ResumeTokenMixin = require('views/mixins/resume-token-mixin');

  const View = FormView.extend({
    template: Template,
    className: 'authorize_signin',

    initialize () {
      this._account = this.model.get('account');
    },

    context () {
      return {
        email: this._account.get('email')
      };
    },

    submit () {
      return this._account.sendLoginAuthorizationEmail(
        this.relier,
        {
          resume: this.getStringifiedResumeToken()
        }
      )
      .then(() => {
        this.navigate('/confirm_signin_authorization', {
          account: this._account
        });
      });
    }
  });

  Cocktail.mixin(
    View,
    BackMixin,
    ResumeTokenMixin
  );

  module.exports = View;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const Cocktail = require('cocktail');
  const BaseView = require('views/base');
  const ExternalLinksMixin = require('views/mixins/external-links-mixin');
  const OpenConfirmationEmailMixin = require('views/mixins/open-webmail-mixin');
  const preventDefaultThen = BaseView.preventDefaultThen;
  const ResendMixin = require('views/mixins/resend-mixin');
  const t = BaseView.t;
  const Template = require('stache!templates/confirm_sign_in_authorization');
  const ConfirmSignInAuthorizationPoll =
    require('models/confirmation/confirm-sign-in-authorization-poll');

  const View = BaseView.extend({
    template: Template,
    className: 'confirm_sign_in_authorization',

    events: {
      'click #resend': preventDefaultThen('resend')
    },

    initialize (options = {}) {
      this._initializeConfirmationPoll(options.confirmationPoll);
    },

    _initializeConfirmationPoll (confirmationPoll) {
      if (! confirmationPoll) {
        confirmationPoll =
          new ConfirmSignInAuthorizationPoll(this.getAccount());
      }

      this.listenTo(
        confirmationPoll, 'confirm-same-browser', this.onConfirmSameBrowser);
      this.listenTo(
        confirmationPoll, 'confirm-different-browser', this.onConfirmDifferentBrowser);
      this.listenTo(confirmationPoll, 'error', this.onPollError);

      this._confirmationPoll = confirmationPoll;

    },

    getAccount () {
      return this.model.get('account');
    },

    context () {
      const email = this.getAccount().get('email');

      return {
        email,
        openWebmailButtonVisible: this.isOpenWebmailButtonVisible(email)
      };
    },

    afterVisible () {
      this._confirmationPoll.start();
    },

    destroy () {
      this._confirmationPoll.stop();
    },

    resend () {
      // a bit screwy, the ResendMixin was made to be used on FormViews. I'm
      // trying to avoid a FormView and instead do things the right way.
      return this.beforeSubmit()
        .then((shouldResend) => {
          if (! shouldResend) {
            return;
          }

          return this.getAccount().sendLoginAuthorizationEmail()
            .then(() => this.displaySuccess());
        });
    },

    onConfirmSameBrowser () {
      this.navigate('signin_authorized', {
        account: this.getAccount()
      });
    },

    onConfirmDifferentBrowser () {
      this.navigate('signin', {
        email: this.getAccount().get('email'),
        success: t('Authorization successful, please sign in again.')
      });
    },

    onPollError (err) {
      this.displayError(err);
      this._confirmationPoll.stop();
    }
  });

  Cocktail.mixin(
    View,
    ExternalLinksMixin,
    OpenConfirmationEmailMixin,
    ResendMixin
  );

  module.exports = View;
});

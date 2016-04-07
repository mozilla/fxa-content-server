/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var AuthErrors = require('lib/auth-errors');
  var BaseView = require('views/base');
  var Cocktail = require('cocktail');
  var Constants = require('lib/constants');
  var ExperimentMixin = require('views/mixins/experiment-mixin');
  var FormView = require('views/form');
  var ResendMixin = require('views/mixins/resend-mixin');
  var ResumeTokenMixin = require('views/mixins/resume-token-mixin');
  var ServiceMixin = require('views/mixins/service-mixin');
  var Template = require('stache!templates/confirm_sign_in');

  var View = FormView.extend({
    template: Template,
    className: 'confirm_sign_in',

    // used by unit tests
    VERIFICATION_POLL_IN_MS: Constants.VERIFICATION_POLL_IN_MS,

    initialize: function () {
      // Account data is passed in from sign up and sign in flows.
      // It's important for Sync flows where account data holds
      // ephemeral properties like unwrapBKey and keyFetchToken
      // that need to be sent to the browser.
      this._account = this.user.initAccount(this.model.get('account'));
    },

    getAccount: function () {
      return this._account;
    },

    context: function () {
      var email = this.getAccount().get('email');

      return {
        email: email,
        isOpenGmailButtonVisible: this._isOpenGmailButtonVisible(),
        safeEmail: encodeURIComponent(email)
      };
    },

    _isOpenGmailButtonVisible: function () {
      var email = this.getAccount().get('email');
      // The "Open Gmail" is only visible in certain contexts
      // we do not show it in mobile contexts because it performs worse on mobile
      return this.broker.hasCapability('openGmailButtonVisible') && email.indexOf('@gmail.com') > 0;
    },

    events: {
      'click #open-gmail': '_gmailTabOpened',
      // validateAndSubmit is used to prevent multiple concurrent submissions.
      'click #resend': BaseView.preventDefaultThen('validateAndSubmit')
    },

    _bouncedEmailSignup: function () {
      this.navigate('signup', {
        bouncedEmail: this.getAccount().get('email')
      });
    },

    _gmailTabOpened: function () {
      this.logViewEvent('openGmail.clicked');
    },

    beforeRender: function () {
      // user cannot confirm a sign-in if they have not initiated a sign in
      if (! this.getAccount().get('sessionToken')) {
        this.navigate('signup');
        return false;
      }
    },

    afterRender: function () {
      var graphic = this.$el.find('.graphic');
      graphic.addClass('pulse');

      this.transformLinks();
    },

    afterVisible: function () {
      // TODO Add polling logic
    },

    submit: function () {
      var self = this;

      self.logViewEvent('resend');

      return self.getAccount().retrySignInConfirmation(
        self.relier,
        {
          resume: self.getStringifiedResumeToken()
        }
      )
      .then(function () {
        self.displaySuccess();
      })
      .fail(function (err) {
        if (AuthErrors.is(err, 'INVALID_TOKEN')) {
          return self.navigate('signup', {
            error: err
          });
        }

        // unexpected error, rethrow for display.
        throw err;
      });
    },

    // The ResendMixin overrides beforeSubmit. Unless set to undefined,
    // Cocktail runs both the original version and the overridden version.
    beforeSubmit: undefined
  });

  Cocktail.mixin(
    View,
    ExperimentMixin,
    ResendMixin,
    ResumeTokenMixin,
    ServiceMixin
  );

  module.exports = View;
});

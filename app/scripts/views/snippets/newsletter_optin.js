/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Allow the user to sign up for the newsletter.

define([
  'underscore',
  'views/base',
  'views/snippets/snippet',
  'lib/session',
  'lib/auth-errors',
  'lib/newsletter',
  'stache!templates/snippets/newsletter_optin'
], function (_, BaseView, SnippetView, Session, AuthErrors, Newsletter, Template) {
  'use strict';

  var SUCCESS_MESSAGE_MS = 5000;

  var t = BaseView.t;

  var View = SnippetView.extend({
    template: Template,

    initialize: function (options) {
      options = options || {};
      this.successMessageMS = options.successMessageMS || SUCCESS_MESSAGE_MS;
    },

    events: {
      'click #newsletter-optin': '_signUpForNewsletter'
    },

    _signUpForNewsletter: function () {
      this.$('.marketing').hide();
      this.$('.spinner').show();

      return Newsletter.signUp(Session.email)
          .then(_.bind(this._displaySuccess, this),
                _.bind(this._displayError, this));
    },

    _displaySuccess: function () {
      this.displaySuccess(t('Preference saved. Thanks!'));
      this.setTimeout(_.bind(this.hideSuccess, this), this.successMessageMS);
    },

    _displayError: function (errorMessage) {
      var err = AuthErrors.toError('ERROR_SIGNUP', errorMessage);
      this.displayError(err);
    }
  });

  return View;
});



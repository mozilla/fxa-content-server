/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Allow the user to sign up for the newsletter.

define([
  'views/base',
  'views/snippets/snippet',
  'lib/session',
  'lib/auth-errors',
  'lib/newsletter',
  'stache!templates/snippets/newsletter_optin'
], function (BaseView, SnippetView, Session, AuthErrors, Newsletter, Template) {
  'use strict';

  var NEWSLETTER_ANIMATION_DURATION_MS = 400;
  var NEWSLETTER_SUCCESS_MESSAGE_MS = 5000;

  var t = BaseView.t;

  var View = SnippetView.extend({
    template: Template,
    events: {
      'click #newsletter-optin': '_signUpForNewsletter'
    },

    _signUpForNewsletter: function () {
      var self = this;

      return Newsletter.signUp(Session.email)
          .then(_.bind(self._displaySuccess, self),
                _.bind(self._displayError, self));
    },

    _displaySuccess: function displaySuccess() {
      var self = this;
      self.$('.marketing').fadeOut(NEWSLETTER_ANIMATION_DURATION_MS, function() {
        self.displaySuccess(t('Preference saved. Thanks!'));
        self.setTimeout(function () {
          self.$('.success').fadeOut(NEWSLETTER_ANIMATION_DURATION_MS);
        }, NEWSLETTER_SUCCESS_MESSAGE_MS);
      });
    },

    _displayError: function displayError(errorMessage) {
      var self = this;
      var err = AuthErrors.toError('ERROR_NEWSLETTER_SIGNUP', errorMessage);
      self.$('.marketing').fadeOut(NEWSLETTER_ANIMATION_DURATION_MS, function() {
        self.displayError(err);
      });
    }
  });

  return View;
});



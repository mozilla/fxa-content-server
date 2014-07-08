/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Allow the user to sign up for the newsletter.

define([
  'views/base',
  'views/snippets/snippet',
  'lib/auth-errors',
  'stache!templates/snippets/newsletter_optin'
], function (BaseView, SnippetView, AuthErrors, Template) {
  'use strict';

  var SUCCESS_MESSAGE_MS = 5000;

  var t = BaseView.t;

  var View = SnippetView.extend({
    template: Template,

    initialize: function (options) {
      options = options || {};
      this._newsletterClient = options.newsletterClient;
      this._successMessageMS = options.successMessageMS || SUCCESS_MESSAGE_MS;
    },

    events: {
      'click #newsletter-optin': '_signUpForNewsletter'
    },

    _signUpForNewsletter: function () {
      var self = this;
      self.$('.marketing').hide();
      self.$('.spinner').show();

      var email = self.getSignedInAccount().get('email');
      self.logScreenEvent('newsletter.optin');
      return self._newsletterClient.signUp(email)
        .then(function () {
          self.logScreenEvent('newsletter.optin.success');
          self.displaySuccess(t('Preference saved. Thank you!'));
          self.setTimeout(self.hideSuccess.bind(self), self._successMessageMS);
        }, function (errorMessage) {
          var err = AuthErrors.toError('ERROR_NEWSLETTER_SIGNUP', errorMessage);
          self.displayError(err);
        });
    }
  });

  return View;
});



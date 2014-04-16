/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// forceAuth means a user must sign in as a specific user.

'use strict';

define([
  'p-promise',
  'views/base',
  'views/sign_in',
  'stache!templates/force_auth',
  'lib/session',
  'lib/url'
],
function (p, BaseView, SignInView, Template, Session, Url) {
  var t = BaseView.t;

  var View = SignInView.extend({
    template: Template,
    className: 'force-auth',

    initialize: function (options) {
      options = options || {};

      SignInView.prototype.initialize.call(this, options);

      // kill the user's local session, set forceAuth flag
      Session.clear();
      Session.set('forceAuth', true);

      var email = Url.searchParam('email', this.window.location.search);
      if (email) {
        // email indicates the signed in email. Use forceEmail to avoid
        // collisions across sessions.
        Session.set('forceEmail', email);
      }
    },

    context: function () {
      var error = '';
      if (! Session.forceEmail) {
        error = t('/force_auth requires an email');
      }

      return {
        email: Session.forceEmail,
        forceAuth: Session.forceAuth,
        error: error,
        isSync: Session.service === 'sync'
      };
    },

    events: {
      'click a[href="/confirm_reset_password"]': 'resetPasswordNow'
    },

    submit: function () {
      var email = Session.forceEmail;
      var password = this.$('.password').val();

      return this._requestPasswordReset(email, password);
    },

    resetPasswordNow: BaseView.preventDefaultThen(function () {
      var self = this;
      return p().then(function () {
        return self._resetPasswordForEmail(Session.forceEmail);
      });
    })
  });

  return View;
});


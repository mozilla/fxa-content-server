/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A broker that is used when no other auth_brokers really cut it.
 * This broker doesn't really do much besides redirect to a notification
 * screen when an action completes.
 */
'use strict';

define([
  'lib/promise',
  'models/auth_brokers/base'
], function (p, BaseAuthenticationBroker) {

  var DefaultAuthenticationBroker = BaseAuthenticationBroker.extend({
    _navigate: function (view, page) {
      return p().then(function () {
        view.navigate(page);
      });
    },

    afterSignIn: function (view) {
      return this._navigate(view, 'settings');
    },

    afterSignUpConfirmed: function (view) {
      return this._navigate(view, 'signup_complete');
    },

    afterResetPasswordConfirmed: function (view) {
      return this._navigate(view, 'reset_password_complete');
    }
  });

  return DefaultAuthenticationBroker;
});

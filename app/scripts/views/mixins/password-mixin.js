/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// helper functions for views with passwords. Meant to be mixed into views.

'use strict';

define([
], function () {
  return {
    events: {
      'change .show-password': 'onPasswordVisibilityChange'
    },

    afterRender: function () {
      if (this.isPasswordAutoCompleteDisabled()) {
        this.$('form').attr('autocomplete', 'off');
      }
    },

    onPasswordVisibilityChange: function (event) {
      var target = this.$(event.target);
      this.setPasswordVisibilityFromButton(target);

      // for docs on aria-controls, see
      // http://www.w3.org/TR/wai-aria/states_and_properties#aria-controls
      var controlsSelector = '#' + target.attr('aria-controls');
      this.focus(controlsSelector);
    },

    isPasswordAutoCompleteDisabled: function () {
      // Sync users should never be allowed to save their password. If they
      // were, it would end in this weird situation where sync users ask to
      // save their sync password to sync before sync is setup.
      return this.relier.isSync();
    },

    setPasswordVisibilityFromButton: function (button) {
      var isVisible = this.$(button).is(':checked');
      this.setPasswordVisibility(isVisible);
    },

    setPasswordVisibility: function (isVisible) {
      try {
        var passwordField = this.$('.password');
        if (isVisible) {
          // text password fields should *never* offer to save the password
          // because the password could end up being auto-filled when
          // the user does not expect it.
          passwordField.attr('type', 'text').attr('autocomplete', 'off');
          this.logScreenEvent('password.visible');
        } else {
          passwordField.attr('type', 'password').removeAttr('autocomplete');
          this.logScreenEvent('password.hidden');
        }
      } catch(e) {
        // IE8 blows up when changing the type of the input field. Other
        // browsers might too. Ignore the error.
      }
    }
  };
});

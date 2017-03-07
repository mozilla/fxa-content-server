/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Cocktail = require('cocktail');
  const FloatingPlaceholderMixin = require('views/mixins/floating-placeholder-mixin');
  const FormView = require('views/form');
  const SettingsPanelMixin = require('views/mixins/settings-panel-mixin');
  const Template = require('stache!templates/settings/emails');

  var View = FormView.extend({
    template: Template,
    className: 'emails',
    viewName: 'settings.emails',

    initialize () {
      this._emails = [];
    },

    context () {
      return {
        emails: this._emails,
        newEmail: this.newEmail
      };
    },


    beforeRender () {
      var account = this.getSignedInAccount();
      return account.getEmails()
        .then((emails) => {
          // TODO Convert to Email Model
          this._emails = emails;
        });
    },

    submit () {
      var account = this.getSignedInAccount();

      var newEmail = this.getElementValue('input.new-email').trim();

      return account.createEmail(newEmail)
        .then(()=> {
          this.newEmail = '';
        });
    },
  });

  Cocktail.mixin(
    View,
    SettingsPanelMixin,
    FloatingPlaceholderMixin
  );

  module.exports = View;
});

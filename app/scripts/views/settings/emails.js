/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const BaseView = require('views/base');
  const Cocktail = require('cocktail');
  const Email = require('models/email');
  const FloatingPlaceholderMixin = require('views/mixins/floating-placeholder-mixin');
  const FormView = require('views/form');
  const preventDefaultThen = require('views/base').preventDefaultThen;
  const SettingsPanelMixin = require('views/mixins/settings-panel-mixin');
  const Template = require('stache!templates/settings/emails');

  var t = BaseView.t;

  var View = FormView.extend({
    template: Template,
    className: 'emails',
    viewName: 'settings.emails',

    events: {
      'click .email-disconnect': preventDefaultThen('_onDisconnectEmail')
    },

    initialize () {
      this._emails = [];
    },

    context () {
      return {
        emails: this._emails,
        hasSecondaryEmail: this._hasSecondaryEmail(),
        newEmail: this.newEmail
      };
    },

    beforeRender () {
      var account = this.getSignedInAccount();
      return account.getEmails()
        .then((emails) => {
          this._emails = emails.map((email) => {
            return new Email(email);
          });
        });
    },

    _hasSecondaryEmail () {
      return this._emails.length > 1;
    },

    _onDisconnectEmail (event) {
      const email = $(event.currentTarget).data('id');
      const account = this.getSignedInAccount();
      return account.deleteEmail(email)
        .then(()=> {
          this.render();
        });
    },

    submit () {
      const account = this.getSignedInAccount();
      const newEmail = this.getElementValue('input.new-email').trim();
      return account.createEmail(newEmail)
        .then(()=> {
          this.displaySuccess(t('Email added. Please check your email and verify account.'));
          this._emails.push(new Email({email: newEmail}));
          this.render();
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

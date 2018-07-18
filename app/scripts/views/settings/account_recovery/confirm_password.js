/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cocktail = require('cocktail');
const FormView = require('../../form');
const PasswordMixin = require('../../mixins/password-mixin');
const ModalSettingsPanelMixin = require('../../mixins/modal-settings-panel-mixin');
const Template = require('templates/settings/account_recovery/confirm_password.mustache');

const View = FormView.extend({
  template: Template,
  className: 'account-recovery-confirm-password',
  viewName: 'settings.account-recovery.confirm-password',

  events: {
    'click .cancel-link': FormView.preventDefaultThen('_returnToAccountRecovery')
  },

  initialize() {
    this.showRecoveryKey = false;
  },

  setInitialContext(context) {
    const account = this.getSignedInAccount();
    const email = account.get('email');
    context.set({
      email
    });
  },

  submit() {
    this.showRecoveryKey = true;
    this.navigate('settings/account_recovery/recovery_key');
  },
});

Cocktail.mixin(
  View,
  ModalSettingsPanelMixin,
  PasswordMixin
);

module.exports = View;


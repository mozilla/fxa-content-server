/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const Cocktail = require('cocktail');
const FormView = require('../form');
const SettingsPanelMixin = require('../mixins/settings-panel-mixin');
const Template = require('templates/settings/account_recovery.mustache');

const View = FormView.extend({
  template: Template,
  className: 'account-recovery',
  viewName: 'settings.account-recovery',

  events: {
    'click .confirm-password': FormView.preventDefaultThen('_confirmPassword'),
    'click .confirm-revoke': FormView.preventDefaultThen('_confirmRevoke')
  },

  _confirmPassword() {
    this.navigate('settings/account_recovery/confirm_password');
  },

  _confirmRevoke() {
    this.navigate('settings/account_recovery/confirm_revoke');
  },

  _onRecoveryKeyChange(recoveryKey) {
    this.model.set('recoveryKey', recoveryKey);
    return this.render();
  },

  initialize() {
    this.listenTo(this.model, 'change', this._onRecoveryKeyChange);
  },

  setInitialContext(context) {
    const recoveryKey = this.model.get('recoveryKey');

    context.set({
      hasRecoveryKey: recoveryKey && recoveryKey.get('key'),
      isPanelOpen: this.isPanelOpen(),
    });
  },

  cancel() {
    return this.render()
      .then(() => this.navigate('settings'));
  }
});

Cocktail.mixin(
  View,
  SettingsPanelMixin
);

module.exports = View;

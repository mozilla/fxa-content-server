/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cocktail = require('cocktail');
const BaseView = require('../../base');
const PasswordMixin = require('../../mixins/password-mixin');
const ModalSettingsPanelMixin = require('../../mixins/modal-settings-panel-mixin');
const Template = require('templates/settings/account_recovery/confirm_revoke.mustache');

const View = BaseView.extend({
  template: Template,
  className: 'account-recovery-confirm-revoke',
  viewName: 'settings.account-recovery.confirm-revoke',

  events: {
    'click .cancel-link': '_returnToAccountRecovery',
    'click .revoke': 'revokeRecoveryCode'
  },

  initialize() {},

  revokeRecoveryCode() {
    // Set model to some recovery key
    const recoveryKey = {
      key: undefined
    };
    this.model.set('recoveryKey', recoveryKey);
    this.navigate('settings/account_recovery', recoveryKey);
  },
});

Cocktail.mixin(
  View,
  ModalSettingsPanelMixin,
  PasswordMixin
);

module.exports = View;


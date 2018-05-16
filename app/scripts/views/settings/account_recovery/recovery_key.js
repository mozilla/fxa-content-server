/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cocktail = require('cocktail');
const BaseView = require('../../base');
const ModalSettingsPanelMixin = require('../../mixins/modal-settings-panel-mixin');
const Template = require('templates/settings/account_recovery/recovery_key.mustache');

const View = BaseView.extend({
  template: Template,
  className: 'account-recovery-key',
  viewName: 'settings.account-recovery.recovery-key',

  events: {
    'click .done-link': '_done'
  },

  _done() {
    // Set model to some recovery key
    const recoveryKey = {
      key: 'some cool key'
    };
    this.model.set('recoveryKey', recoveryKey);
    this.navigate('settings/account_recovery', recoveryKey);
  },

  initialize() {},

  setInitialContext(context) {
    context.set({});
  }
});

Cocktail.mixin(
  View,
  ModalSettingsPanelMixin
);

module.exports = View;


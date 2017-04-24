/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const AvatarMixin = require('views/mixins/avatar-mixin');
  const Cocktail = require('cocktail');
  const FloatingPlaceholderMixin = require('views/mixins/floating-placeholder-mixin');
  const FormView = require('views/form');
  const SettingsPanelMixin = require('views/mixins/settings-panel-mixin');
  const { t } = require('views/base');
  const Template = require('stache!templates/settings/display_name');

  var View = FormView.extend({
    template: Template,
    className: 'display-name',
    viewName: 'settings.display-name',

    initialize () {
      const account = this.getSignedInAccount();
      // To minimize flicker after updating the displayName,
      // fetchProfile is not called in beforeRender. The latency
      // in the XHR request made it so the user submit the name,
      // the panel closed, and the button would only update a
      // second or two later. Instead, call fetchProfile here,
      // then re-do the initial render once the profile is fetched.
      // When the user updates the displayName, `onProfileUpdate`
      // will be called immediately, causing an immediate re-render.
      account.once('change:displayName', () => this.render());
      return account.fetchProfile()
        .then(() => this.user.setAccount(account));
    },

    onProfileUpdate () {
      this.render();
    },

    context () {
      return this.getSignedInAccount().pick('displayName');
    },

    events: {
      'focus input.display-name': 'onDisplayNameFocus',
    },

    onDisplayNameFocus () {
      this.isValidStart();
    },

    isValidStart () {
      // if no display name set then we still do not want to activate the change button
      var accountDisplayName = this.getSignedInAccount().get('displayName') || '';
      var displayName = this.getElementValue('input.display-name').trim();

      return accountDisplayName !== displayName;
    },

    submit () {
      const account = this.getSignedInAccount();
      const displayName = this.getElementValue('input.display-name').trim();

      return this.updateDisplayName(account, displayName)
        .then(() => {
          this.logViewEvent('success');
          this.displaySuccess(t('Display name updated'));
          this.navigate('settings');
        });
    }
  });

  Cocktail.mixin(
    View,
    AvatarMixin,
    SettingsPanelMixin,
    FloatingPlaceholderMixin
  );

  module.exports = View;
});

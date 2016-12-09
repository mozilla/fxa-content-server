/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*/

define(function (require, exports, module) {
  'use strict';

  const Cocktail = require('cocktail');
  const FormView = require('views/form');
  const SecurityHistory = require('models/security-history');
  const SettingsPanelMixin = require('views/mixins/settings-panel-mixin');
  const SignedOutNotificationMixin = require('views/mixins/signed-out-notification-mixin');
  const Template = require('stache!templates/settings/security-history');

  var View = FormView.extend({
    template: Template,
    className: 'security',
    viewName: 'settings.security-history',

    initialize (options) {
      this._securityEvents = new SecurityHistory();
    },

    beforeRender () {
      return this._securityEvents.fetchHistory({}, this.user);
    },

    context () {
      let securityEvents = this._securityEvents.toJSON();

      return {
        isPanelEnabled: this._isPanelEnabled(),
        isPanelOpen: this.isPanelOpen(),
        securityEvents: securityEvents,
      };
    },

    _isPanelEnabled () {
      return true;
    },

    openPanel () {
      this.logViewEvent('open');
      // manually submit using an element to trigger the progress indicator mixin
      this.$el.find('.security-refresh').trigger('submit');
    },

    submit () {
      if (this.isPanelOpen()) {
        this.logViewEvent('refresh');
        // only refresh devices if panel is visible
        this.render();
      }
    },

  });

  Cocktail.mixin(
    View,
    SettingsPanelMixin,
    SignedOutNotificationMixin
  );

  module.exports = View;
});


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// helper functions for views with a profile image. Meant to be mixed into views.

define([
  'jquery',
  'views/base'
], function ($, BaseView) {
  'use strict';

  return {
    initialize: function (options) {
      this.superView = options.superView;
    },
    events: {
      'click .settings-unit-toggle': BaseView.preventDefaultThen('_triggerPanel'),
      'click .cancel': BaseView.preventDefaultThen('closePanelReturnToSettings')
    },

    _triggerPanel: function (event) {
      var href = event && $(event.currentTarget).data('href');
      if (href) {
        this.navigate(href);
      }
    },

    openPanel: function () {
      var unit = this.$('.settings-unit');
      unit.addClass('open');
    },

    closePanelReturnToSettings: function () {
      this.navigate('settings');
      this.closePanel();
    },

    closePanel: function () {
      this.$('.settings-unit').removeClass('open');
    },

    displaySuccess: function (msg) {
      var self = this;
      if (! self.superView) {
        return;
      }
      self.superView.displaySuccess(msg);
      self.closePanel();
    }
  };
});

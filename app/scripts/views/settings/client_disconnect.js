/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var Cocktail = require('cocktail');
  var FormView = require('views/form');
  var ModalSettingsPanelMixin = require('views/mixins/modal-settings-panel-mixin');
  var Template = require('stache!templates/settings/client_disconnect');

  var View = FormView.extend({
    template: Template,
    className: 'clients-disconnect',
    viewName: 'settings.client.disconnect',

    events: {
    },

    context: function () {
      return {};
    }
  });

  Cocktail.mixin(
    View,
    ModalSettingsPanelMixin
  );

  module.exports = View;
});

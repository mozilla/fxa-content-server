/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var Cocktail = require('cocktail');
  var Constants = require('lib/constants');
  var FloatingPlaceholderMixin = require('views/mixins/floating-placeholder-mixin');
  var FormView = require('views/form');
  var SignedOutNotificationMixin = require('views/mixins/signed-out-notification-mixin');
  var ModalSettingsPanelMixin = require('views/mixins/modal-settings-panel-mixin');
  var Template = require('stache!templates/settings/client_disconnect');

  var View = FormView.extend({
    template: Template,
    className: 'clients-disconnect',
    viewName: 'settings.client.disconnect',

    events: {
      'change select': 'selectOption',
      'click': 'closePanelIfDone',
    },

    initialize: function () {
      // receive the device collection and the item to delete
      // if deleted the collection will be automatically updated in the settings panel.
      this.deviceId = this.model.get('itemId');
      this.item = this.model.get('clients').get(this.deviceId);
      this.toDisconnect = true;
    },

    beforeRender: function () {
      // prevent direct navigation to disconnect
      if (! this.deviceId) {
        this.navigate('settings/clients');
        return false;
      }
    },

    context: function () {
      return {
        deviceName: this.item.get('name'),
        reasonLost: this.reasonLost,
        reasonSuspicious: this.reasonSuspicious,
        toDisconnect: this.toDisconnect
      };
    },

    afterRender: function () {
      this.disableForm();
    },

    selectOption: function (event) {
      var selectedOption = $(event.currentTarget).find(':selected');
      var index = selectedOption.index();
      if (index === 0) {
        this.disableForm();
      } else {
        this.enableForm();
      }
    },

    submit: function () {
      var item = this.item;
      this.logViewEvent('disconnect.');
      this.logViewEvent('disconnect.'); // TODO: type.

      return this.user.destroyAccountClient(this.user.getSignedInAccount(), item)
        .then(() => {
          var clientType = item.get('clientType');
          var selectedValue = $('.disconnect-reasons').find(':selected').val();
          this.toDisconnect = false;
          // TODO: success event

          // TODO: clean up
          if (selectedValue === 'lost' || selectedValue === 'suspicious') {
            if (selectedValue === 'lost') {
              this.reasonSuspicious = true;
            } else {
              this.reasonLost = true;
            }
            this.render();
          } else {
            // close the modal
            this._closePanelReturnToSettings();
          }

          // if disconnected the current device then sign out
          if (clientType === Constants.CLIENT_TYPE_DEVICE && item.get('isCurrentDevice')) {
            this.navigateToSignIn();
          }
        });
    },

    closePanelIfDone: function () {
      if (this.toDisconnect === false) {
        this._closePanelReturnToSettings();
      }
    }

  });

  Cocktail.mixin(
    View,
    ModalSettingsPanelMixin,
    FloatingPlaceholderMixin,
    SignedOutNotificationMixin
  );

  module.exports = View;
});

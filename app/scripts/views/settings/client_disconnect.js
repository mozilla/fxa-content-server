/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Cocktail = require('cocktail');
  const FloatingPlaceholderMixin = require('views/mixins/floating-placeholder-mixin');
  const FormView = require('views/form');
  const ModalSettingsPanelMixin = require('views/mixins/modal-settings-panel-mixin');
  const SignedOutNotificationMixin = require('views/mixins/signed-out-notification-mixin');
  const t = require('views/base').t;
  const Template = require('stache!templates/settings/client_disconnect');

  const REASON_SELECTOR = '.disconnect-reasons';
  const REASON_HELP = {
    'lost': t('We\'re sorry to hear about this. You should change your Firefox Account password, and look for ' +
      'information from your device manufacturer about erasing your data remotely.'),
    'suspicious': t('We\'re sorry to hear about this. If this was a device you really don\'t trust, you should change your ' +
      'Firefox Account password, and change any passwords saved in Firefox.')
  };

  var View = FormView.extend({
    template: Template,
    className: 'clients-disconnect',
    viewName: 'settings.clients.disconnect',

    events: {
      'change select': 'selectOption',
      'click': 'closePanelIfDisconnected'
    },

    initialize () {
      // user is presented with an option to disconnect device
      this.toDisconnect = true;
    },

    beforeRender () {
      // receive the device collection and the item to delete
      // if deleted the collection will be automatically updated in the settings panel.
      let clients = this.model.get('clients');
      let deviceId = this.model.get('itemId');
      if (! clients || ! deviceId) {
        return this.navigate('settings/clients');
      }

      this.item = clients.get(deviceId);
    },

    context () {
      return {
        deviceName: this.item.get('name'),
        reasonHelp: this.reasonHelp,
        toDisconnect: this.toDisconnect
      };
    },

    afterRender () {
      // disable the form by default, user must select an option
      this.disableForm();
    },

    /**
     * Called on option select.
     * If first option is selected then form is disabled.
     *
     * @param {Event} event
     */
    selectOption (event) {
      let optionIndex = this.$el.find(event.currentTarget).find(':selected').index();
      if (optionIndex === 0) {
        this.disableForm();
      } else {
        this.enableForm();
      }
    },

    submit () {
      let item = this.item;
      let selectedValue = this.$el.find(REASON_SELECTOR).find(':selected').val();
      this.logViewEvent('submit.' + selectedValue);

      return this.user.destroyAccountClient(this.user.getSignedInAccount(), item)
        .then(() => {
          // user has disconnect the device
          this.toDisconnect = false;
          this.reasonHelp = REASON_HELP[selectedValue];
          // if we can provide help for this disconnect reason
          if (this.reasonHelp) {
            this.render();
          } else {
            // close the modal
            this._closePanelReturnToClients();
          }

          // if disconnected the current device then sign out
          if (item.get('isCurrentDevice')) {
            this.navigateToSignIn();
          }
        });
    },

    /**
     * Called on panel interaction.
     * Closes the panel if device was disconnected.
     */
    closePanelIfDisconnected () {
      if (! this.toDisconnect) {
        this._closePanelReturnToClients();
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

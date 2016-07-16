/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*/

define(function (require, exports, module) {
  'use strict';

  var _ = require('underscore');
  var $ = require('jquery');
  var Cocktail = require('cocktail');
  var Services = require('models/services');
  var FormView = require('views/form');
  var preventDefaultThen = require('views/base').preventDefaultThen;
  var SettingsPanelMixin = require('views/mixins/settings-panel-mixin');
  var SignedOutNotificationMixin = require('views/mixins/signed-out-notification-mixin');
  var t = require('views/base').t;
  var Template = require('stache!templates/settings/services');
  var Url = require('lib/url');

  var REMOVED_ANIMATION_MS = 150;
  var FORCE_DEVICE_LIST_VIEW = 'forceServicesList';

  var View = FormView.extend({
    template: Template,
    className: 'services',
    viewName: 'settings.services',

    initialize: function (options) {
      this._able = options.able;
      this._services = options.services;

      // An empty Devices instance is created to render the initial view.
      // Data is only fetched once the panel has been opened.
      if (! this._services) {
        this._services = new Services([], {
          notifier: options.notifier
        });
      }

      this._services.on('add', this._onServiceAdded.bind(this));
      this._services.on('remove', this._onRemoved.bind(this));
    },

    context: function () {
      return {
        services: this._services.toJSON(),
        isPanelEnabled: this._isPanelEnabled(),
        isPanelOpen: this.isPanelOpen(),
      };
    },

    events: {
      'click .service-disconnect': preventDefaultThen('_onDisconnectService')
    },

    _onServiceAdded: function () {
      this.render();
    },

    _isPanelEnabled: function () {
      return this._able.choose('serviceListVisible', {
        forceServicesList: Url.searchParam(FORCE_DEVICE_LIST_VIEW, this.window.location.search)
      });
    },

    _onRemoved: function (item) {
      var id = item.get('id');
      var self = this;
      $('#' + id).slideUp(REMOVED_ANIMATION_MS, function () {
        // TODO: do we need to rerender?
        self.render();
      });
    },

    _onDisconnectService: function (event) {
      this.logViewEvent('disconnect');
      var itemId = $(event.currentTarget).attr('data-id');
      this._destroyService(itemId);
    },

    _onRefreshDeviceList: function () {
      var self = this;
      if (this.isPanelOpen()) {
        this.logViewEvent('refresh');
        // only refresh devices if panel is visible
        // if panel is hidden there is no point of fetching devices
        this._fetchDevices().then(function () {
          self.render();
        });
      }
    },

    openPanel: function () {
      this.logViewEvent('open');
      this._fetchServices();
    },

    _fetchServices: function () {
      var account = this.getSignedInAccount();
      return this.user.fetchAccountServices(account, this._services);
    },

    _destroyService: function (serviceId) {
      var self = this;
      var account = this.getSignedInAccount();
      var service = this._services.get(serviceId);
      if (service) {
        this.user.destroyAccountService(account, service).then(function () {
            self.render()
        })
        // TODO: if content-server, logout?
      }
    }
  });

  Cocktail.mixin(
    View,
    SettingsPanelMixin,
    SignedOutNotificationMixin
  );

  module.exports = View;
});

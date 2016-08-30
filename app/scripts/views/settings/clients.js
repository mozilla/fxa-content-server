/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*/

define(function (require, exports, module) {
  'use strict';

  var _ = require('underscore');
  var $ = require('jquery');
  var Cocktail = require('cocktail');
  var AttachedClients = require('models/attached-clients');
  var FormView = require('views/form');
  var preventDefaultThen = require('views/base').preventDefaultThen;
  var SettingsPanelMixin = require('views/mixins/settings-panel-mixin');
  var SignedOutNotificationMixin = require('views/mixins/signed-out-notification-mixin');
  var Strings = require('lib/strings');
  var t = require('views/base').t;
  var P = require('lib/promise');
  var Template = require('stache!templates/settings/clients');
  var Url = require('lib/url');

  var DEVICE_REMOVED_ANIMATION_MS = 150;
  var DEVICES_SUPPORT_URL = 'https://support.mozilla.org/kb/fxa-managing-devices';
  var UTM_PARAMS = '?utm_source=accounts.firefox.com&utm_medium=referral&utm_campaign=fxa-devices';
  var FIREFOX_DOWNLOAD_LINK = 'https://www.mozilla.org/firefox/new/' + UTM_PARAMS;
  var FIREFOX_ANDROID_DOWNLOAD_LINK = 'https://www.mozilla.org/firefox/android/' + UTM_PARAMS;
  var FIREFOX_IOS_DOWNLOAD_LINK = 'https://www.mozilla.org/firefox/ios/' +  UTM_PARAMS;
  var FORCE_DEVICE_LIST_VIEW = 'forceDeviceList';
  var FORCE_APPS_LIST_VIEW = 'forceAppsList';

  var View = FormView.extend({
    template: Template,
    className: 'devices',
    viewName: 'settings.devices',

    initialize: function (options) {
      this._able = options.able;

      this._attachedClients = new AttachedClients([], {
        notifier: options.notifier
      });

      this.listenTo(this._attachedClients, 'add', this._onItemAdded);
      this.listenTo(this._attachedClients, 'remove', this._onItemRemoved);
    },

    _formatAccessTime: function (items) {
      return _.map(items, function (item) {
        if (item.lastAccessTimeFormatted) {
          item.lastAccessTimeFormatted = Strings.interpolate(
            t('Last active: %(translatedTimeAgo)s'), { translatedTimeAgo: item.lastAccessTimeFormatted });
        } else {
          // unknown lastAccessTimeFormatted or not possible to format.
          item.lastAccessTimeFormatted = '';
        }
        return item;
      });
    },

    context: function () {
      return {
        clients: this._formatAccessTime(this._attachedClients.toJSON()),
        clientsPanelManageString: this._getManageString(),
        clientsPanelTitle: this._getPanelTitle(),
        devicesSupportUrl: DEVICES_SUPPORT_URL,
        isPanelEnabled: this._isPanelEnabled(),
        isPanelOpen: this.isPanelOpen(),
        linkAndroid: FIREFOX_ANDROID_DOWNLOAD_LINK,
        linkIOS: FIREFOX_IOS_DOWNLOAD_LINK,
        linkLinux: FIREFOX_DOWNLOAD_LINK,
        linkOSX: FIREFOX_DOWNLOAD_LINK,
        linkWindows: FIREFOX_DOWNLOAD_LINK
      };
    },

    events: {
      'click .client-disconnect': preventDefaultThen('_onDisconnectClient'),
      'click .clients-refresh': preventDefaultThen('_onRefreshClientsList')
    },

    _isPanelEnabled: function () {
      return this._able.choose('deviceListVisible', {
        forceDeviceList: Url.searchParam(FORCE_DEVICE_LIST_VIEW, this.window.location.search)
      });
    },

    _getPanelTitle: function () {
      var title = t('Devices');

      if (this._isAppsListVisible()) {
        title = t('Devices & apps');
      }

      return title;
    },

    _getManageString: function () {
      var title = t('You can manage your devices below.');

      if (this._isAppsListVisible()) {
        title = t('You can manage your devices and apps below.');
      }

      return title;
    },

    _isAppsListVisible: function () {
      // OAuth Apps list is visible if `appsListVisible` chooses `true`.
      return this._able.choose('appsListVisible', {
        forceAppsList: Url.searchParam(FORCE_APPS_LIST_VIEW, this.window.location.search)
      });
    },

    _onItemAdded: function () {
      this.render();
    },

    _onItemRemoved: function (item) {
      $('#' + item.get('id')).slideUp(DEVICE_REMOVED_ANIMATION_MS);
    },

    _onDisconnectClient: function (event) {
      var itemId = $(event.currentTarget).data('id');
      // type of client that was disconnected, can be 'client' or 'device'.
      var clientType = $(event.currentTarget).data('type');

      this.logViewEvent(clientType + '.disconnect');
      this._attachedClients.removeClient(itemId, this.user, this.getSignedInAccount())
        .then((client) => {
          if (client.get('clientType') === 'device' && client.get('isCurrentDevice')) {
            this.navigateToSignIn();
          }
        });
    },

    _onRefreshClientsList: function () {
      if (this.isPanelOpen()) {
        this.logViewEvent('refresh');
        // only refresh devices if panel is visible
        // if panel is hidden there is no point of fetching devices
        this._fetchAttachedClients().then(() => {
          this.render();
        });
      }
    },

    openPanel: function () {
      this.logViewEvent('open');
      this._fetchAttachedClients();
    },

    _fetchAttachedClients: function () {
      var account = this.getSignedInAccount();
      var attachedClients = this._attachedClients;
      var fetchItems = [account.fetchDevices(attachedClients)];

      if (this._isAppsListVisible()) {
        fetchItems.push(account.fetchOAuthApps(attachedClients));
      }

      return P.all(fetchItems);
    }

  });

  Cocktail.mixin(
    View,
    SettingsPanelMixin,
    SignedOutNotificationMixin
  );

  module.exports = View;
});


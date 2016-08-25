/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * The auth broker to coordinate authenticating for Sync when
 * embedded in the Firefox for iOS 1.0 ... < 2.0.
 */

define(function (require, exports, module) {
  'use strict';

  const _ = require('underscore');
  const p = require('lib/promise');

  const FxDesktopV1AuthenticationBroker = require('models/auth_brokers/fx-desktop-v1');

  const proto = FxDesktopV1AuthenticationBroker.prototype;

  const FxiOSV1AuthenticationBroker = FxDesktopV1AuthenticationBroker.extend({
    defaultCapabilities: _.extend({}, proto.defaultCapabilities, {
      chooseWhatToSyncCheckbox: false,
      convertExternalLinksToText: true
    }),

    _notifyRelierOfLogin: function (account) {
      /**
       * As a workaround for sign-in/sign-up confirmation view disappearing
       * on iOS, delay the login message sent via the channel by 5 seconds.
       * This will give the user an indication that they need to verify
       * their email address.
       */
      const defer = p.defer();

      this.window.setTimeout(() => {
        var loginData = this._getLoginData(account);

        if (! this._hasRequiredLoginFields(loginData)) {
          defer.resolve();
        }
        this.send(this.getCommand('LOGIN'), loginData);
      }, 5000);

      return defer.promise;
    },
  });

  module.exports = FxiOSV1AuthenticationBroker;
});

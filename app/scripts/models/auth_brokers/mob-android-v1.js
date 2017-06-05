/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * For Android apps that integrate with the standalone Sync library.
 * Communicates with the app using WebChannels.
 */

define(function (require, exports, module) {
  'use strict';

  const _ = require('underscore');
  const FxSyncWebChannelAuthenticationBroker = require('./fx-sync-web-channel');

  const proto = FxSyncWebChannelAuthenticationBroker.prototype;

  module.exports = FxSyncWebChannelAuthenticationBroker.extend({
    defaultCapabilities: _.extend({}, proto.defaultCapabilities, {
      chooseWhatToSyncCheckbox: false,
      chooseWhatToSyncWebV1: false, // TODO - check this
      openWebmailButtonVisible: false,
      sendAfterSignInConfirmationPollNotice: true,
      sendAfterSignUpConfirmationPollNotice: true,
    }),

    type: 'mob-android-v1'
  });
});


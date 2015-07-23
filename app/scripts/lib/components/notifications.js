/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/constants',
  'lib/channels/web',
  'models/notifications',
  'component!lib/components/inter-tab-channel',
  'component!lib/components/iframe-channel',
], function (Constants, WebChannel, Notifications, interTabChannel, iframeChannel) {
  'use strict';

  var notificationWebChannel = new WebChannel(Constants.ACCOUNT_UPDATES_WEBCHANNEL_ID);
  notificationWebChannel.initialize();

  return new Notifications({
    tabChannel: interTabChannel,
    iframeChannel: iframeChannel,
    webChannel: notificationWebChannel
  });
});

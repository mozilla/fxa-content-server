/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/fxa-client',
  'component!lib/components/config',
  'component!lib/components/inter-tab-channel',
], function (FxaClient, config, interTabChannel) {
  'use strict';

  return new FxaClient({
    interTabChannel: interTabChannel,
    authServerUrl: config.authServerUrl
  });
});

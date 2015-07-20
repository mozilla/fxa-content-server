/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/metrics',
  'lib/screen-info',
  'lib/storage-metrics',
  'component!lib/components/able',
  'component!lib/components/config',
  'component!lib/components/context',
  'component!lib/components/relier',
  'component!lib/components/unique-user-id',
  'component!lib/components/window'
], function (Metrics, ScreenInfo, StorageMetrics, able, config, context, relier, uniqueUserId, window) {
  'use strict';

  function createMetrics(options) {
    if (context.isAutomatedBrowser()) {
      return new StorageMetrics(options);
    }
    return new Metrics(options);
  }

  var isSampledUser = able.choose('isSampledUser', {
    env: config.env,
    uniqueUserId: uniqueUserId
  });

  var screenInfo = new ScreenInfo(window);
  var metrics = createMetrics({
    lang: config.language,
    service: relier.get('service'),
    context: relier.get('context'),
    entrypoint: relier.get('entrypoint'),
    migration: relier.get('migration'),
    campaign: relier.get('campaign'),
    clientHeight: screenInfo.clientHeight,
    clientWidth: screenInfo.clientWidth,
    devicePixelRatio: screenInfo.devicePixelRatio,
    screenHeight: screenInfo.screenHeight,
    screenWidth: screenInfo.screenWidth,
    able: able,
    isSampledUser: isSampledUser,
    uniqueUserId: uniqueUserId,
    utmCampaign: relier.get('utmCampaign'),
    utmContent: relier.get('utmContent'),
    utmMedium: relier.get('utmMedium'),
    utmSource: relier.get('utmSource'),
    utmTerm: relier.get('utmTerm')
  });
  metrics.init();

  return metrics;
});

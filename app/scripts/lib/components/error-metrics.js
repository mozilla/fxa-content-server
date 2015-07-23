/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/sentry',
  'component!lib/components/able',
  'component!lib/components/config',
  'component!lib/components/unique-user-id',
  'component!lib/components/window',
], function (SentryMetrics, able, config, uniqueUserId, window) {
  'use strict';

  if (config && config.env && able) {
    var abData = {
      env: config.env,
      uniqueUserId: uniqueUserId
    };
    var abChoose = able.choose('sentryEnabled', abData);

    if (abChoose) {
      return new SentryMetrics(window.location.host);
    }
  }
});

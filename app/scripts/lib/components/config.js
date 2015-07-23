/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'component!lib/components/config-loader'
], function (configLoader) {
  'use strict';

  return configLoader.fetch().then(function (config) {
    configLoader.useConfig(config);
    return config;
  });
});

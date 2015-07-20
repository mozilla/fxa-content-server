/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/marketing-email-client',
  'component!lib/components/config'
], function (MarketingEmailClient, config) {
  'use strict';

  return new MarketingEmailClient({
    baseUrl: config.marketingEmailServerUrl,
    preferencesUrl: config.marketingEmailPreferencesUrl
  });
});

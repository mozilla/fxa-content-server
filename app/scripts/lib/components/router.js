/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'router',
  'lib/session',
  'component!lib/components/able',
  'component!lib/components/authentication-broker',
  'component!lib/components/config',
  'component!lib/components/form-prefill',
  'component!lib/components/fxa-client',
  'component!lib/components/inter-tab-channel',
  'component!lib/components/metrics',
  'component!lib/components/notifications',
  'component!lib/components/relier',
  'component!lib/components/user',
], function (Router, Session, able, authenticationBroker, config, formPrefill,
             fxaClient, interTabChannel, metrics, notifications, relier, user) {
  'use strict';

  return new Router({
    metrics: metrics,
    language: config.language,
    relier: relier,
    broker: authenticationBroker,
    fxaClient: fxaClient,
    user: user,
    interTabChannel: interTabChannel,
    session: Session,
    formPrefill: formPrefill,
    notifications: notifications,
    able: able
  });
});

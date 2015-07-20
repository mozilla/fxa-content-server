/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/session',
  'models/auth_brokers/base',
  'models/auth_brokers/fx-desktop',
  'models/auth_brokers/fx-desktop-v2',
  'models/auth_brokers/first-run',
  'models/auth_brokers/web-channel',
  'models/auth_brokers/redirect',
  'models/auth_brokers/iframe',
  'component!lib/components/assertion',
  'component!lib/components/context',
  'component!lib/components/fxa-client',
  'component!lib/components/iframe-channel',
  'component!lib/components/metrics',
  'component!lib/components/relier',
  'component!lib/components/oauth-client',
  'component!lib/components/window',
], function (
  Session,
  BaseAuthenticationBroker,
  FxDesktopV1AuthenticationBroker,
  FxDesktopV2AuthenticationBroker,
  FirstRunAuthenticationBroker,
  WebChannelAuthenticationBroker,
  RedirectAuthenticationBroker,
  IframeAuthenticationBroker,
  assertion,
  context,
  fxaClient,
  iframeChannel,
  metrics,
  relier,
  oAuthClient,
  window
) {
  'use strict';

  /*eslint complexity: [2, 8] */
  var authenticationBroker;
  if (context.isFirstRun()) {
    authenticationBroker = new FirstRunAuthenticationBroker({
      iframeChannel: iframeChannel,
      relier: relier,
      window: window
    });
  } else if (context.isFxDesktopV2()) {
    authenticationBroker = new FxDesktopV2AuthenticationBroker({
      window: window,
      relier: relier
    });
  } else if (context.isFxDesktopV1()) {
    authenticationBroker = new FxDesktopV1AuthenticationBroker({
      window: window,
      relier: relier
    });
  } else if (context.isWebChannel()) {
    authenticationBroker = new WebChannelAuthenticationBroker({
      window: window,
      relier: relier,
      fxaClient: fxaClient,
      assertionLibrary: assertion,
      oAuthClient: oAuthClient,
      session: Session
    });
  } else if (context.isIframe()) {
    authenticationBroker = new IframeAuthenticationBroker({
      window: window,
      relier: relier,
      assertionLibrary: assertion,
      oAuthClient: oAuthClient,
      session: Session,
      channel: iframeChannel,
      metrics: metrics
    });
  } else if (context.isOAuth()) {
    authenticationBroker = new RedirectAuthenticationBroker({
      window: window,
      relier: relier,
      assertionLibrary: assertion,
      oAuthClient: oAuthClient,
      session: Session
    });
  } else {
    authenticationBroker = new BaseAuthenticationBroker({
      relier: relier
    });
  }

  authenticationBroker.on('error', function (err) {
    window.console.error('broker error', String(err));
    metrics.logError(err);
  });

  metrics.setBrokerType(authenticationBroker.type);

  return authenticationBroker.fetch().then(function () {
    return authenticationBroker;
  });
});

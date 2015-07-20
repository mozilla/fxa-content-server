/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/session',
  'models/reliers/relier',
  'models/reliers/oauth',
  'models/reliers/fx-desktop',
  'component!lib/components/context',
  'component!lib/components/translator',
  'component!lib/components/oauth-client',
  'component!lib/components/window',
], function (Session, Relier, OAuthRelier, FxDesktopRelier, context, translator, oAuthClient, window) {
  'use strict';

  var relier;
  if (context.isFxDesktop()) {
    // Use the FxDesktopRelier for sync verification so that
    // the service name is translated correctly.
    relier = new FxDesktopRelier({
      window: window,
      translator: translator
    });
  } else if (context.isOAuth()) {
    relier = new OAuthRelier({
      window: window,
      oAuthClient: oAuthClient,
      session: Session
    });
  } else {
    relier = new Relier({
      window: window
    });
  }

  return relier.fetch().then(function () {
    return relier;
  });
});

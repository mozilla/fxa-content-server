/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/auth-errors',
  'lib/channels/iframe',
  'lib/channels/null',
  'component!lib/components/context',
  'component!lib/components/metrics',
  'component!lib/components/window',
], function (AuthErrors, IframeChannel, NullChannel, context, metrics, window) {
  'use strict';

  if (! context.isInAnIframe()) {
    // Create a NullChannel in case any dependencies require it, such
    // as when the FirstRunAuthenticationBroker is used in functional
    // tests. The firstrun tests don't actually use an iframe, so the
    // real IframeChannel is not created.
    return new NullChannel();
  }

  return context.checkParentOrigin()
    .then(function (parentOrigin) {
      if (! parentOrigin) {
        // No allowed origins were found. Illegal iframe.
        throw AuthErrors.toError('ILLEGAL_IFRAME_PARENT');
      }

      var iframeChannel = new IframeChannel();
      iframeChannel.initialize({
        window: window,
        origin: parentOrigin,
        metrics: metrics
      });

      return iframeChannel;
    });
});

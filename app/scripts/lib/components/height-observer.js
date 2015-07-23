/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'component!lib/components/context',
  'component!lib/components/iframe-channel',
  'component!lib/components/window',
  'lib/height-observer',
], function (context, iframeChannel, window, HeightObserver) {
  'use strict';

  if (context.isInAnIframe()) {
    var heightObserver = new HeightObserver({
      target: window.document.body,
      window: window
    });

    heightObserver.on('change', function (height) {
      iframeChannel.send('resize', { height: height });
    });

    heightObserver.start();
  }
});

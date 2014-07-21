/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/constants',
  'lib/channels/null',
  'lib/channels/fx_desktop',
  'lib/channels/fx_web'
], function (Constants, NullChannel, FxDesktopChannel, FxWebChannel) {
  'use strict';

  function create(options) {
    options = options || {};

    var channel;

    if (options.context === Constants.FX_DESKTOP_CONTEXT) {
      // Firefox for desktop native=>FxA glue code.
      channel = new FxDesktopChannel();
    } else if (options.webChannelId) {
      // A channel that attempts to listen for messages
      // from the Firefox browser.
      channel = new FxWebChannel();
    } else {
      // default to the null channel that doesn't do anything.
      channel = new NullChannel();
    }

    channel.init(options);
    return channel;
  }

  return {
    create: create
  };
});



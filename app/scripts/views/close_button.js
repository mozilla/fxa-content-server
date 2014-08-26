/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * The IFrame'd OAuth flow has a little cancel button.
 * When clicked, this module sends an `oauth_cancel` message
 * to the parent that indicates "close me!"
 */

define([
  'views/base',
  'lib/channels'
],
function (BaseView, Channels) {
  var View = BaseView.extend({
    el: '#close',

    events: {
      'click': 'close'
    },

    close: function (event) {
      event.preventDefault();

      /**
       * It's not a mistake to expect a response. Really, we expect the
       * window to be closed. If the window is not closed and no response is
       * received, then there is an error.
       */
      Channels.sendExpectResponse('oauth_cancel');
    }
  });

  return View;
});


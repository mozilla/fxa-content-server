/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'component!lib/components/authentication-broker',
  'views/close_button',
], function (authenticationBroker, CloseButtonView) {
  'use strict';

  if (authenticationBroker.canCancel()) {
    var closeButton = new CloseButtonView({
      broker: authenticationBroker
    });
    closeButton.render();
  }
});

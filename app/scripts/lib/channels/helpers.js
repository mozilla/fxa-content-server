/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([],
  function () {

    function noOp() {
      // Nothing to do here.
    }

    function createEvent(command, data) {
      /*jshint validthis: true*/
      return new this.window.CustomEvent('FirefoxAccountsCommand', {
        detail: {
          command: command,
          data: data,
          bubbles: true
        }
      });
    }

    return {
      noOp: noOp,
      createEvent: createEvent
    };

  });


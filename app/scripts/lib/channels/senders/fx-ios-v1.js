/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Send a message to the browser using a FirefoxAccountsCommand.
 */

'use strict';

class FxIosV1Sender {
  constructor () {
    // nothing to do here.
  }

  initialize (options = {}) {
    this._window = options.window;
  }

  send (command, data, messageId) {
    return Promise.resolve().then(() => {
      return this.dispatchCommand(command, data, messageId);
    });
  }

  dispatchCommand (command, data, messageId) {
    var win = this._window;
    var event = createEvent(win, command, data, messageId);
    win.dispatchEvent(event);
  }

  teardown () {
    // nothing to do.
  }
}

// messageId is ignored by FxIos
function createEvent(win, command, data/*, messageId*/) {
  return new win.CustomEvent('FirefoxAccountsCommand', {
    detail: {
      bubbles: true,
      command: command,
      data: data
    }
  });
}

module.exports = FxIosV1Sender;



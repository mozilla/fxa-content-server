/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// A channel used to communicate with Firefox for iOS using
// a CustomEvent sender and a postMessage receiver.

'use strict';

const DuplexChannel = require('lib/channels/duplex');
const FxIosV1Sender = require('lib/channels/senders/fx-ios-v1');
const PostMessageReceiver = require('lib/channels/receivers/postmessage');

class FxIosV1Channel extends DuplexChannel {
  initialize (options = {}) {
    const win = options.window || window;

    const sender = this._sender = new FxIosV1Sender();
    sender.initialize({
      window: win
    });

    const receiver = this._receiver = new PostMessageReceiver();
    receiver.initialize({
      origin: options.origin,
      window: win
    });

    super.initialize({
      receiver: receiver,
      sender: sender,
      window: win
    });
  }

  createMessageId (command) {
    // The browser does not return messageIds, it silently ignores any
    // that are sent. It will return a `status` field that is the same
    // as the command. Use the command (which is returned as status)
    // as the messageId.
    return command;
  }

  parseMessage (message) {
    if (! (message && message.content)) {
      throw new Error('malformed message');
    }

    var content = message.content;
    return {
      command: content.status,
      data: content.data,
      // The browser does not return messageIds, it returns a `status` field
      // in the content. Use the `status` field as the messageId.
      // See
      // https://dxr.mozilla.org/mozilla-central/source/browser/base/content/aboutaccounts/aboutaccounts.js#244
      // and
      // https://dxr.mozilla.org/mozilla-central/source/browser/base/content/aboutaccounts/aboutaccounts.js#193
      messageId: content.status
    };
  }
}

module.exports = FxIosV1Channel;



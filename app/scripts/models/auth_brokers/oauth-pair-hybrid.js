/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Manages the OAuth flow by webchannel messages to the browser,
// to help with a pairing-based flow.

define(function (require, exports, module) {
  'use strict';

  const OAuthAuthenticationBroker = require('../auth_brokers/oauth');

  const proto = OAuthAuthenticationBroker.prototype;

  module.exports = OAuthAuthenticationBroker.extend({
    type: 'pair-hybrid',

    // TODO: default behaviours should be to show a success screen,
    // since the page will stay open.

    // TODO: somehow obtain geolocation info from the browser?
    // Maybe that should be the responsibility of the relier
    // rather than the broker.  Also we don't yet have a place
    // to display it here.

    getOAuthResult(account, options = {}) {
      options.keysJwe = console.log('ASK THE BROWSER FOR keys_jwe VIA WEBCHANNEL');
      return proto.getOAuthResult.call(this, account, options);
    },

    _provisionScopedKeys() {
      throw new Error('this should never be called');
    },

    sendOAuthResultToRelier (result) {
      console.log('SEND VIA WEBCHANNEL', result.code, result.state);
    }
  });
});

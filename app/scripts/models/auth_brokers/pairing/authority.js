/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import encryptBundle from '../../../lib/crypto/encrypt';
import OAuthBroker from '../oauth';
import { pick } from 'underscore';
import ChannelServerClient from '../../../lib/channel-server-client';
import AuthorityStateMachine from '../../pairing/auth-state-machine';

export default class AuthorityBroker extends OAuthBroker {
  initialize (options = {}) {
    super.initialize(options);

    const { config, notifier } = options;

    const channelServerUrl = config.pairingChannelServerUrl;
    this.channelServerClient = new ChannelServerClient({
      // TODO - pick a random salt or let the channel server client pick one.
      salt: '12345678901234567890123456789012'
    }, {
      channelServerUrl,
      notifier,
    });

    this.stateMachine = new AuthorityStateMachine({}, {
      channelServerClient: this.channelServerClient,
      notifier,
    });


    this.listenTo(this.channelServerClient, 'change', this.updateWithChannelServerChanges);
  }

  updateWithChannelServerChanges () {
    this.set(this.channelServerClient.pick('channelId', 'salt', 'symmetricKey'));
  }

  start () {
    this.channelServerClient.createNew();
    this.channelServerClient.startUpdateInterval();
  }

  afterPairAuthAllow (account, password, model) {
    return Promise.resolve()
      .then(() => {
        // There may be no sessionToken stored in localStorage
        // if the user signed up for Sync from about:preferences
        // and then loaded /pair/auth directly w/o also specifying
        // ?service=sync. It's very strange.
        if (! account.get('sessionToken')) {
          return account.signIn(password, this.relier);
        }
      }).then(() => {
        return account.accountKeys(password, this.relier);
      }).then(keys => {
        // TODO - should this use the scoped keys createEncryptedBundle?
        // encryptBundle requires ECDH keys anyways. The answer seems an obvious yes.
        return encryptBundle(keys, this.relier.get('keysJwk'));
      }).then(keysJwe => {
        return this.getOAuthResult(account, { keysJwe });
      }).then(result => {
        const resultToSend = pick(result, 'code', 'state');
        resultToSend.redirect = this.relier.get('redirectUri');

        this.notifier.trigger('pair:auth:approve', {
          result: resultToSend
        });
      });
  }
}

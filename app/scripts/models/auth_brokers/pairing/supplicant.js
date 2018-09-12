/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import OAuthRedirectBroker from '../oauth-redirect';
import ChannelServerClient from '../../../lib/channel-server-client';
import SupplicantStateMachine from '../../pairing/supp-state-machine';
import Url from '../../../lib/url';

export default class SupplicantBroker extends OAuthRedirectBroker {
  initialize (options = {}) {
    super.initialize(options);

    const { config, notifier, relier } = options;

    const channelServerUrl = config.pairingChannelServerUrl;

    const { channelId, symmetricKey, uid } = relier.toJSON();
    if (channelId && symmetricKey && uid) {
      this.channelServerClient = new ChannelServerClient({
        channelId,
        salt: uid,
        symmetricKey,
      },
      {
        channelServerUrl,
        notifier,
      });

      this.suppStateMachine = new SupplicantStateMachine({}, {
        channelServerClient: this.channelServerClient,
        notifier,
      });

      this.channelServerClient.attachToExisting();
    }
  }

  afterPairSupplicantAllow () {
    return Promise.resolve().then(() => {
      this.notifier.trigger('pair:supp:request', this.relier.getPKCEParams());
    });
  }

  afterCodeReceived (code, redirectUri, state) {
    const result = {
      redirect: Url.updateSearchString(redirectUri, {
        code,
        state
      })
    };

    this.sendOAuthResultToRelier(result);
  }
}

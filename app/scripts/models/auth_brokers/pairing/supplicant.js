/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DEVICE_PAIRING_REDIRECT_URI, DEVICE_PAIRING_SCOPES } from '../../../lib/constants';
import OAuthBroker from '../oauth';
import ChannelServerClient from '../../../lib/channel-server-client';
import SupplicantStateMachine from '../../pairing/supp-state-machine';

function loadOAuthUtils () {
  return import(/* webpackChunkName "fxaCryptoRelier" */ 'fxaCryptoRelier')
    .then(loaded => loaded.OAuthUtils);
}

export default class SupplicantBroker extends OAuthBroker {
  initialize (options = {}) {
    super.initialize(options);

    const { config, notifier, relier } = options;


    this._oAuthClientId = config.oAuthClientId;
    this._oAuthServer = config.oAuthUrl + '/v1';

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
      if (! this.relier.get('keysJwk')) {
        return this.getOAuthUtils().then(oauthUtils => {
          return oauthUtils.getKeyFlowParams(this._oAuthClientId, {
            redirectUri: DEVICE_PAIRING_REDIRECT_URI,
            scopes: DEVICE_PAIRING_SCOPES,
          });
        }).then(({ codeVerifier, params }) => {
          this.relier.initializeWithPKCEParams(params);
          this.relier.set('codeVerifier', codeVerifier);
        });
      }
    }).then(() => {
      this.notifier.trigger('pair:supp:request', this.relier.getPKCEParams());
    });
  }

  afterCodeReceived (code) {
    return this.tradeCodeForKeys(code)
      .then(result => {
        this.notifier.trigger('pair:supp:complete', { result });
      });
  }

  tradeCodeForKeys (code) {
    return this.getOAuthUtils().then(oauthUtils => {
      const { clientId, codeVerifier }  = this.relier.toJSON();
      return oauthUtils.tradeCodeForKeys(clientId, code, codeVerifier);
    });
  }

  getOAuthUtils () {
    return Promise.resolve().then(() => {
      if (this._oauthUtils) {
        return this._oauthUtils;
      }

      return loadOAuthUtils().then(OAuthUtils => {
        this._oauthUtils = new OAuthUtils({
          oauthServer: this._oAuthServer
        });
        return this._oauthUtils;
      });
    });
  }
}

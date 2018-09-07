/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import { DEVICE_PAIRING_REDIRECT_URI, DEVICE_PAIRING_SCOPES } from '../../lib/constants';
import OAuthErrors from '../../lib/oauth-errors';
import Relier from './relier';
import Vat from '../../lib/vat';

/*eslint-disable camelcase, sorting/sort-object-props*/
const SENT_TO_AUTHORITY_FROM_SUPPLICANT_SCHEMA = {
  access_type: Vat.accessType().renameTo('accessType'),
  client_id: Vat.clientId().required().renameTo('clientId'),
  code_challenge: Vat.codeChallenge().required().renameTo('codeChallenge'),
  code_challenge_method: Vat.codeChallengeMethod().required().renameTo('codeChallengeMethod'),
  keys_jwk: Vat.keysJwk().required().renameTo('keysJwk'),
  response_type: Vat.string().required().valid('token', 'code').renameTo('responseType'),
  redirect_uri: Vat.string().required().valid(DEVICE_PAIRING_REDIRECT_URI).renameTo('redirectUri'),
  scope: Vat.string().required().valid(DEVICE_PAIRING_SCOPES.join(' ')),
  state: Vat.string().required()
};

const SUPPLICANT_HASH_PARAMETER_SCHEMA = {
  channelId: Vat.hex().len(32).required(),
  symmetricKey: Vat.string().len(32).required(),
  uid: Vat.uid().required(),
};
/*eslint-enable camelcase, sorting/sort-object-props*/

export default class SupplicantRelier extends Relier {
  initialize (attrs, config = {}) {
    super.initialize(attrs, config);

    this._isSupplicant = config.isSupplicant;
  }

  fetch () {
    if (this._isSupplicant) {
      return this.initializeAsSupplicant();
    }
  }

  getPKCEParams () {
    return {
      /*eslint-disable camelcase*/
      access_type: this.get('accessType'),
      client_id: this.get('clientId'),
      code_challenge: this.get('codeChallenge'),
      code_challenge_method: this.get('codeChallengeMethod'),
      keys_jwk: this.get('keysJwk'),
      redirect_uri: this.get('redirectUri'),
      response_type: this.get('responseType'),
      scope: this.get('scope'),
      state: this.get('state'),
      /*eslint-enable camelcase*/
    };
  }

  initializeWithPKCEParams (pkceParams = {}) {
    this.importFromObjectUsingSchema(
      pkceParams, SENT_TO_AUTHORITY_FROM_SUPPLICANT_SCHEMA, OAuthErrors);
  }

  initializeAsSupplicant () {
    this.importHashParamsUsingSchema(SUPPLICANT_HASH_PARAMETER_SCHEMA, OAuthErrors);
  }

  wantsKeys () {
    return true;
  }

  validateApprovalData (approvalData) {
    const { code, redirect, state } = approvalData;

    // TODO - Maybe use Transform instead of direct checks like this.

    if (Vat.oauthCode().validate(code).error) {
      throw OAuthErrors.toInvalidParameterError('code');
    }
    // TODO - redirect is set to the redirectURI on the auth-server
    if (! redirect) {
      throw OAuthErrors.toMissingParameterError('redirect');
    }

    if (state !== this.get('state')) {
      throw OAuthErrors.toInvalidParameterError('state');
    }
  }
}

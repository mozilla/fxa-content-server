/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Cocktail from 'cocktail';
import { Model } from 'backbone';
import md5 from 'js-md5';
import recoveryKeys from './crypto/recovery-keys';
import UserAgentMixin from './user-agent-mixin';

const DEFAULT_UPDATE_INTERVAL_MS = 60 * 1000;

const SYMMETRIC_KEY_BYTES = 32;

export default class ChannelServerClient extends Model {
  constructor (attrs = {}, options = {}) {
    if (attrs.channelId) {
      attrs.type = 'supp';
    } else {
      attrs.type = 'auth';
    }
    super(attrs, options);

    this._updateIntervalMS = options.updateIntervalMS || DEFAULT_UPDATE_INTERVAL_MS;
    this._channelServerUrl = options.channelServerUrl;
    this._notifier = options.notifier;
    this.window = options.window || window;
  }

  /**
   * Create a new channel on the channel server and create
   * a channel encryption key. `channelId` and `symmetricKey`
   * will be set as an attribute of the model.
   *
   * Used by the `auth` device.
   */
  createNew () {
    const firstMessageHandler = (event) => {
      this.socket.removeEventListener('message', firstMessageHandler);
      this.socket.addEventListener('message', (event) => this.encryptedMessageHandler(event));

      // the first event is always the channel identifier.
      const channelId = this._getChannelIdFromEventData(event.data);
      this._generateSymmetricKey().then((symmetricKey) => {
        this.trigger('connected');
        this.set({
          channelId,
          symmetricKey,
        });
      });
    };

    this.openSocket(this._channelServerUrl, firstMessageHandler);
  }

  // implies this client is the 'supp'
  attachToExisting (channelId = this.get('channelId')) {
    const firstMessageHandler = (event) => {
      // the first event is always the channel identifier, we already have that
      // so can drop the message on the ground.
      this.socket.removeEventListener('message', firstMessageHandler);
      this.socket.addEventListener('message', (event) => this.encryptedMessageHandler(event));

      this.trigger('connected');
    };

    const existingChannelUrl = `${this._channelServerUrl}${channelId}`;
    this.openSocket(existingChannelUrl, firstMessageHandler);
  }

  openSocket (url, firstMessageHandler) {
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => {
      this.trigger('open');
    });
    this.socket.addEventListener('close', () => {
      this.trigger('close');
    });
    this.socket.addEventListener('error', (event) => {
      this.trigger('error', event);
    });
    this.socket.addEventListener('message', firstMessageHandler);
  }

  encryptedMessageHandler (event) {
    // TODO - the format of the envelope is going to change
    // to include an encrypted envelope and the supp metadata
    this.stopUpdateInterval();
    const ciphertext = JSON.parse(event.data).message;
    this._decrypt(ciphertext).then(decrypted => {
      const { data, message } = decrypted;

      data.confirmationCode = this._getConfirmationCode();
      data.channelServerClient = this;

      this.trigger(message, data);
      this._notifier.trigger(message, data);
    });
  }

  send (message, data = {}) {
    const userAgent = this.getUserAgent();
    data.senderMetaData = {
      OS: userAgent.genericOSName(),
      deviceType: userAgent.genericDeviceType(),
      family: userAgent.browser.name,
      ua: this.getUserAgentString(),
    };
    const envelope = {
      data,
      message,
    };

    return this._encrypt(envelope)
      .then(bundle => this.socket.send(bundle));
  }

  _getChannelIdFromEventData (eventData = '{}') {
    return (JSON.parse(eventData).link || '').replace('/v1/ws/', '');
  }

  _getConfirmationCode (symmetricKey = this.get('symmetricKey')) {
    const keyHash = md5(symmetricKey);
    return `${keyHash.substr(0, 4)}-${keyHash.substr(4, 4)}`;
  }

  _decrypt (cipertext) {
    return this._getEncryptionJwk().then(jwk => {
      return recoveryKeys.unbundleRecoveryData(jwk, cipertext);
    });
  }

  _encrypt (plaintext) {
    return this._getEncryptionJwk().then(jwk => {
      return recoveryKeys.bundleRecoveryData(jwk, plaintext);
    });
  }

  _generateSymmetricKey () {
    // TODO - no need to use recovery.getRecoveryKey to generate this,
    // just generate the number of bytes.
    return recoveryKeys.generateRecoveryKey(SYMMETRIC_KEY_BYTES);
  }

  _getEncryptionJwk () {
    const { jwk, symmetricKey, salt } = this.toJSON();
    if (jwk) {
      return Promise.resolve(jwk);
    }

    // TODO - no need to call recoveryKeys.getRecoveryJwk, create a JWK
    // based on the symmetricKey like so:
    // const keyOptions = {
    //   alg: ENCRYPTION_ALGORITHM,
    //   k: jose.util.base64url.encode(result[0], 'hex'),
    //   kid: recoveryKeyId,
    //   kty: 'oct'
    // };
    // return jose.JWK.asKey(keyOptions);
    // no need for a salt this way.
    return recoveryKeys.getRecoveryJwk(salt, symmetricKey)
      .then(jwk => {
        this.set('jwk', jwk);
        return jwk;
      });
  }

  startUpdateInterval (intervalMS = this._updateIntervalMS) {
    this._updateTimeout = setTimeout(() => {
      this.createNew();
      this.startUpdateInterval(intervalMS);
    }, intervalMS);
  }

  stopUpdateInterval () {
    clearTimeout(this._updateTimeout);
  }

  close () {

  }
}

Cocktail.mixin(
  ChannelServerClient,
  UserAgentMixin,
);

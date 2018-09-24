/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ChannelServerClientErrors from './channel-server-client-errors';
import { Model } from 'backbone';
import { pick } from 'underscore';
import { base64urlToArrayBuffer } from './crypto/util';
import importFxaPairingChannel from './fxa-pairing-channel';
import Raven from 'raven';

/**
 * Connects to the channel server. Expects the following
 * attributes to be passed into the constructor:
 *  - channelId
 *  - channelKey
 *  - channelServerUri
 *
 * @export
 * @class ChannelServerClient
 * @extends {Model}
 */
export default class ChannelServerClient extends Model {
  constructor (attrs = {}, options = {}) {
    super(attrs, options);

    this.sentryMetrics = options.sentryMetrics || Raven;
    this.set('isConnected', false);
  }

  /**
   * Open a socket to `channelId` on `channelServerUri`
   *
   * @param {String} [channelServerUri=this.get('channelServerUri')]
   * @param {String} [channelId=this.get('channelId')]
   * @param {String} [channelKey=this.get('channelKey')]
   * @returns {Promise} resolves when connected
   */
  open (channelServerUri = this.get('channelServerUri'), channelId = this.get('channelId'), channelKey = this.get('channelKey')) {
    return importFxaPairingChannel().then((FxAccountsPairingChannel) => {
      if (this.channel) {
        // to avoid opening a duplicate connection, say the client is connected
        // if a socket exists but isn't yet connected.
        throw ChannelServerClientErrors.toError('ALREADY_CONNECTED');
      }

      if (! channelServerUri || ! channelId) {
        throw ChannelServerClientErrors.toError('INVALID_CONFIGURATION');
      }

      const psk = base64urlToArrayBuffer(channelKey);
      return FxAccountsPairingChannel.PairingChannel.connect(channelServerUri, channelId, psk).then((channel) => {

        this.channel = channel;
        this.set('isConnected', true);
        this.trigger('connected');

        channel.addEventListener('message', this._messageHandler.bind(this));
        channel.addEventListener('error', this._errorHandler.bind(this));
        channel.addEventListener('close', this._closeHandler.bind(this));

      }).catch((err) => {
        this.sentryMetrics.captureException(err);
        this.trigger('error', err);
      });
    });
  }

  /**
   * Close the channel.
   *
   * @returns {Promise} - rejects if no socket, resolves when connection closed
   */
  close () {
    return new Promise((resolve, reject) => {
      if (! this.channel) {
        return reject(ChannelServerClientErrors.toError('NOT_CONNECTED'));
      }

      this.set('isConnected', false);
      return this.channel.close();
    });
  }

  /**
   * Send `message` with `data` to the remote.
   *
   * @param {String} message name of message to send
   * @param {Any} [data={}]
   * @returns {Promise} resolves when complete
   */
  send (message, data = {}) {
    if (! this.get('isConnected') || ! this.channel) {
      return Promise.reject(ChannelServerClientErrors.toError('NOT_CONNECTED'));
    }

    return this.channel.send({
      data,
      message
    });
  }


  /**
   * Handle a message. Expects a message with the
   * following format:
   *
   * ```
   * event.detail = {
   *   "data": {
   *     "data": <message data>,
   *     "message": <message name>,
   *   },
   *   "sender": {
   *     "city": <sender's city name>,
   *     "country": <sender's country name>,
   *     "region": <sender's region>,
   *     "ua": <sender's user agent string>,
   *   }
   * }
   * ```
   *
   * An `error` message will be triggered if there is an error
   * parsing or decrypting the message.
   *
   * @param {Object} event
   * @private
   */
  _messageHandler (event) {
    try {
      const { data: payload, sender } = event.detail;
      const { data = {}, message} = payload;

      if (! message) {
        throw ChannelServerClientErrors.toError('INVALID_MESSAGE');
      }

      data.remoteMetaData = pick(sender, 'city', 'country', 'region', 'ua');
      data.remoteMetaData.ipAddress = sender.remote;

      this.trigger(`remote:${message}`, data);

    } catch (err) {
      this.sentryMetrics.captureException(err);
      this.trigger('error', err);
    }
  }

  /**
   * An error event returned from the fxa-pairing-channel
   * @param {Object} event
   * @private
   */
  _errorHandler (event) {
    this.sentryMetrics.captureException(event.detail);
    this.trigger('error', ChannelServerClientErrors.toError('UNEXPECTED_ERROR'));
  }

  /**
   * A close event returned from the fxa-pairing-channel
   * @param {Object} event
   * @private
   */
  _closeHandler (event) {
    this.trigger('close');
  }
}

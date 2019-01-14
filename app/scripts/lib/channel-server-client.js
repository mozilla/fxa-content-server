/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ChannelServerClientErrors from './channel-server-client-errors';
import { Model } from 'backbone';
import { pick } from 'underscore';
import { hexToBytes} from './crypto/util';

let channelX;
/**
 * Connects to the channel server. Expects the following
 * attributes to be passed into the constructor:
 *  - channelId
 *  - channelKey
 *  - channelServerUrl
 *
 * @export
 * @class ChannelServerClient
 * @extends {Model}
 */
export default class ChannelServerClient extends Model {
  constructor (attrs = {}, options = {}) {
    super(attrs, options);

    this.set('isConnected', false);
  }

  /**
   * Open a socket to `channelId` on `channelServerUrl`
   *
   * @param {String} [channelServerUrl=this.get('channelServerUrl')]
   * @param {String} [channelId=this.get('channelId')]
   * @param {String} [channelKey=this.get('channelKey')]
   * @returns {Promise} resolves when connected
   */
  open (channelServerUrl = this.get('channelServerUrl'), channelId = this.get('channelId'), channelKey = this.get('channelKey')) {
    return new Promise((resolve, reject) => {
      return import(/* webpackChunkName: "fxaPairingChannel" */ 'fxaPairingChannel').then((FxAccountsPairingChannel) => {
        try {
          const InsecurePairingChannel = FxAccountsPairingChannel.InsecurePairingChannel;
          const psk = hexToBytes(channelKey);
          InsecurePairingChannel.connect(channelServerUrl, channelId, psk).then((channel) => {
            channelX = channel;
            this.set('isConnected', true);
            this.trigger('connected');


            channel.addEventListener('message', (event) => {
              console.log('WebSocket receive', event.detail);

              try {
                this._messageHandler(event);
              } catch (e) {
                console.log('messageHandler', e);
              }
            });


            channel.addEventListener('error', (event) => {
              console.log('error', event);

            });

          }).catch((fail) => {
            console.log('fail', fail);
          });

        } catch (e) {
          console.error(e);
          alert(e);
        }

      });


      // if (this.socket) {
      //   // to avoid opening a duplicate connection, say the client is connected
      //   // if a socket exists but isn't yet connected.
      //   return reject(ChannelServerClientErrors.toError('ALREADY_CONNECTED'));
      // }
      //
      // if (! channelServerUrl || ! channelId) {
      //   return reject(ChannelServerClientErrors.toError('INVALID_CONFIGURATION'));
      // }
      //
      // const socketUrl = this._getSocketUrl(channelServerUrl, channelId);
      // this.socket = this._createSocket(socketUrl);
      //
      // this._proxySocketEvents(this.socket);
      //
      // /*eslint-disable no-use-before-define*/
      // const close = () => {
      //   stopListeningToChannelSetupEvents();
      //   reject(ChannelServerClientErrors.toError('COULD_NOT_CONNECT'));
      // };
      //
      // const error = () => {
      //   stopListeningToChannelSetupEvents();
      //   reject(ChannelServerClientErrors.toError('COULD_NOT_CONNECT'));
      // };
      //
      // const message = (event) => {
      //   stopListeningToChannelSetupEvents();
      //
      //   this._checkFirstMessageDataValidity(event.data, channelId)
      //     .then(() => {
      //       this.on('socket:message', (event) => this._messageHandler(event));
      //
      //       this.set('isConnected', true);
      //       this.trigger('connected');
      //
      //       resolve();
      //     }, reject);
      // };
      // /*eslint-enable no-use-before-define*/
      //
      // const stopListeningToChannelSetupEvents = () => {
      //   this.off('socket:close', close);
      //   this.off('socket:error', error);
      //   this.off('socket:message', message);
      // };
      //
      // this.on('socket:close', close);
      // this.on('socket:error', error);
      // this.once('socket:message', message);
    });
  }

  /**
   * Close the channel.
   *
   * @returns {Promise} - rejects if no socket, resolves when connection closed
   */
  close () {
    return new Promise((resolve, reject) => {
      if (! this.socket) {
        return reject(ChannelServerClientErrors.toError('NOT_CONNECTED'));
      }

      /*eslint-disable no-use-before-define*/
      const stopListeningToChannelTeardownEvents = () => {
        this.off('socket:close', close);
        this.off('socket:error', error);
      };

      const close = () => {
        stopListeningToChannelTeardownEvents();
        this.set('isConnected', false);
        resolve();
      };

      const error = (err) => {
        stopListeningToChannelTeardownEvents();
        reject(err);
      };
      /*eslint-enable no-use-before-define*/

      this.on('socket:close', close);
      this.on('socket:error', error);

      this.socket.close();
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
    if (! this.get('isConnected')) {
      return Promise.reject(ChannelServerClientErrors.toError('NOT_CONNECTED'));
    }

    const env = {
      data,
      message
    };
    console.log('WebSocket send', env);
    return channelX.send(env);
  }

  /**
   * Proxy `socket` events as if they were from
   * the client itself. Events names will have
   * a `socket:` prefix, e.g., `socket:open`,
   * `socket:close`
   *
   * @param {WebSocket} socket
   * @private
   */
  _proxySocketEvents (socket) {
    ['close', 'error', 'message', 'open'].forEach(eventName => {
      socket.addEventListener(eventName, (event) => this.trigger(`socket:${eventName}`, event));
    });
  }

  /**
   * Handle an encrypted message. Expects a message with the
   * following format:
   *
   * ```
   * {
   *   "message": <encrypted message>,
   *   "sender": {
   *      "city": <sender's city name>,
   *      "country": <sender's country name>,
   *      "region": <sender's region>,
   *      "ua": <sender's user agent string>
   *   }
   * }
   * ```
   *
   * The encrypted message is expected to have the following format:
   *
   * ```
   * {
   *   "message": <message name>,
   *   "data": <any, specific to the message>
   * }
   *
   * An event is triggered using `message` as a suffix, e.g.,
   * if the `message` is `pair:auth:metadata`, an event
   * named `remote:path:auth:metadata` will be triggered.
   *
   * An `error` message will be triggered if there is an error
   * parsing or decrypting the message.
   *
   * @param {Object} event
   * @private
   */
  _messageHandler (event) {
    console.log('_messageHandler', event);
    try {
      const { data: payload, sender } = event.detail;
      const { data = {}, message} = payload;

      if (! message) {
        throw ChannelServerClientErrors.toError('INVALID_MESSAGE');
      }

      data.remoteMetaData = pick(sender, 'city', 'country', 'region', 'ua');
      data.remoteMetaData.ipAddress = sender.remote;

      console.log('this.trigger', `remote:${message}`, data);
      this.trigger(`remote:${message}`, data);

    } catch (err) {
      this.trigger('error', err);
    }

  }
}

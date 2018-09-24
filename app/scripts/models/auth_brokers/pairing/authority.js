/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Manages the OAuth flow by webchannel messages to the browser,
// to help with a pairing-based flow.

import AuthorityStateMachine from '../../pairing/authority-state-machine';
import OAuthAuthenticationBroker from '../oauth';
import setRemoteMetaData from './remote-metadata';

const PAIR_HEARTBEAT_INTERVAL = 1000;

export default class AuthorityBroker extends OAuthAuthenticationBroker {
  type = 'authority';

  initialize (options) {
    super.initialize(options);

    const { notifier } = options;

    this.stateMachine = new AuthorityStateMachine({}, {
      broker: this,
      notifier,
      relier: this.relier
    });
  }

  fetch () {
    return Promise.resolve()
      .then(() => super.fetch())
      .then(() => this.getSupplicantMetadata())
      .then(() => this.startHeartbeat());
  }

  /**
   * The heartbeat methods below communicate the 'fxaccounts:pair_heartbeat' message.
   * See the pairing documentation for the possible formats of the heartbeat message.
   */
  startHeartbeat () {
    this._heartbeatInterval = setInterval(() => this.heartbeat(), PAIR_HEARTBEAT_INTERVAL);
  }

  stopHeartbeat () {
    clearInterval(this._heartbeatInterval);
  }

  heartbeat () {
    this.request(this._notificationChannel.COMMANDS.PAIR_HEARTBEAT)
      .then(response => {
        if (response.err) {
          this.stateMachine.heartbeatError(response.err);
        } else if (response.suppAuthorized) {
          this.notifier.trigger('pair:supp:authorize');
        }
      });
  }

  _provisionScopedKeys() {
    throw new Error('Cannot provision scoped keys for this broker');
  }

  getSupplicantMetadata() {
    const remoteMetaData = this.get('remoteMetaData');
    if (remoteMetaData) {
      return Promise.resolve(remoteMetaData);
    }

    return this.request(this._notificationChannel.COMMANDS.PAIR_REQUEST_SUPPLICANT_METADATA)
      .then((response) => {
        this.setRemoteMetaData(response);
        return this.get('remoteMetaData');
      });
  }

  setRemoteMetaData = setRemoteMetaData;

  afterPairAuthAllow () {
    // We use `request` instead of `send` despite not waiting for a response so we
    // can let the native side run the entire WebChannel handler.
    return this.request(this._notificationChannel.COMMANDS.PAIR_AUTHORIZE).then(() => {
      this.notifier.trigger('pair:auth:authorize');
    });
  }

  afterPairAuthDecline () {
    // We use `request` instead of `send` despite not waiting for a response so we
    // can let the native side run the entire WebChannel handler.
    return this.request(this._notificationChannel.COMMANDS.PAIR_DECLINE);
  }

  afterPairAuthComplete () {
    // We use `request` instead of `send` despite not waiting for a response so we
    // can let the native side run the entire WebChannel handler.
    return this.request(this._notificationChannel.COMMANDS.PAIR_COMPLETE);
  }

  request(message, data = {}) {
    return Promise.resolve().then(() => {
      data.channel_id = this.relier.get('channelId'); //eslint-disable-line camelcase

      return this._notificationChannel.request(message, data);
    });
  }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from 'chai';
import PairingChannelClient from 'lib/pairing-channel-client';
import sinon from 'sinon';
import PairingChannelClientErrors from '../../../scripts/lib/pairing-channel-client-errors';

describe('lib/pairing-channel-client', () => {
  let client;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    client = new PairingChannelClient({
      channelId: 'c05d62ed4e1445089e9e2a33d148f906',
      channelKey: 'channel-key',
      channelServerUri: 'wss://channel.server.url/v1/',
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('open', () => {
    beforeEach(() => {
    });

    it('rejects if already connected', () => {
      client.socket = {
        send: sinon.spy()
      };

      return client.open()
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'ALREADY_CONNECTED'));
        });
    });

    it('rejects if no channelServerUri', () => {
      return client.open(null, 'c05d62ed4e1445089e9e2a33d148f906')
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'INVALID_CONFIGURATION'));
        });
    });

    it('rejects if no channelId', () => {
      return client.open('wss://channel.server.url/', null)
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'INVALID_CONFIGURATION'));
        });
    });

    it('opens a WebSocket connection to `channelId`, attaches listeners, resolves when first message received', () => {
      sandbox.stub(client, '_proxySocketEvents').callsFake(() => {
        // The first message causes `open` to resolve, the second message
        // causes `_encryptedMessageHandler` to be called.
        setImmediate(() => client.trigger('socket:message', { data: {} }));
      });

      sandbox.spy(client, 'trigger');

      sandbox.stub(client, '_getSocketUrl').callsFake(() => 'wss://some.socket.url/some/path');
      sandbox.stub(client, '_checkFirstMessageDataValidity').callsFake(() => Promise.resolve());

      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906')
        .then(() => {
          assert.isTrue(client._getSocketUrl.calledOnceWith('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906'));
          assert.isTrue(client._proxySocketEvents.calledOnce);
          assert.isTrue(client.trigger.calledWith('connected'));

          // the second message causes _encryptedMessageHandler
          // to be called
          return new Promise((resolve, reject) => {
            sandbox.stub(client, '_encryptedMessageHandler').callsFake(resolve);
            client.trigger('socket:message');
          });
        });
    });

    it('rejects if `_checkFirstMessageDataValidity` rejects', () => {
      sandbox.stub(client, '_proxySocketEvents').callsFake(() => {
        // The first message causes `open` to resolve, the second message
        // causes `_encryptedMessageHandler` to be called.
        setImmediate(() => client.trigger('socket:message', { data: {} }));
      });
      sandbox.stub(client, '_checkFirstMessageDataValidity').callsFake(() => Promise.reject(PairingChannelClientErrors.toError('INVALID_MESSAGE')));
      return client.open('c05d62ed4e1445089e9e2a33d148f906')
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'INVALID_MESSAGE'));
        });
    });

    it('rejects if socket error before first message', () => {
      sandbox.stub(client, '_proxySocketEvents').callsFake(() => {
        setImmediate(() => client.trigger('socket:error'));
      });

      return client.open('c05d62ed4e1445089e9e2a33d148f906')
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'COULD_NOT_CONNECT'));
        });
    });
  });

  describe('close', () => {
    it('rejects if no socket', () => {
    });

    it('rejects if error while closing', () => {
    });

    it('calls close on the socket, resolves when complete', () => {

    });
  });

  describe('send', () => {
    it('rejects if no socket', () => {
    });

    it('throws if not connected', () => {
    });

    it('encrypts the message, sends the ciphertext to the remote', () => {
    });
  });
});

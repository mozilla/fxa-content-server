/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from 'chai';
import PairingChannelClient from 'lib/pairing-channel-client';
import sinon from 'sinon';
import PairingChannelClientErrors from '../../../scripts/lib/pairing-channel-client-errors';

const defaultChannelMock = {
  addEventListener: () => sinon.spy(),
  close: sinon.spy(() => Promise.resolve()),
  send: sinon.spy(() => Promise.resolve())
};

const mockPairingChannel = function(channelApi = defaultChannelMock) {
  return Promise.resolve().then(() => {
    return {
      PairingChannel: {
        connect: () => {
          return Promise.resolve(channelApi);
        }
      }
    };
  });
};

describe('lib/pairing-channel-client', () => {
  let client;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('open', () => {
    beforeEach(() => {
      client = new PairingChannelClient({}, {
        importPairingChannel: mockPairingChannel
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

    it('rejects if no channelKey', () => {
      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906')
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'INVALID_CONFIGURATION'));
        });
    });

    it('sets connected if channel resolves', () => {
      client.set = sinon.spy();
      client.trigger = sinon.spy();

      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906', '1111')
        .then(() => {
          assert.isTrue(client.set.calledOnceWith('isConnected', true));
          assert.isTrue(client.trigger.calledOnceWith('connected'));
        });
    });

    it('rejects if already connected', () => {
      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906', '1111').then(() => {
        return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906', '1111')
          .then(assert.fail, err => {
            assert.isTrue(PairingChannelClientErrors.is(err, 'ALREADY_CONNECTED'));
          });
      });
    });
  });

  describe('close', () => {
    beforeEach(() => {
      client = new PairingChannelClient({}, {
        importPairingChannel: mockPairingChannel
      });
    });

    it('rejects if no channel', () => {
      delete client.channel;
      return client.close()
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'NOT_CONNECTED'));
        });
    });

    it('rejects if error while closing', () => {
      const closeError = new Error('uh oh');
      client.channel = {
        close: sinon.spy(() => {
          throw closeError;
        }),
      };

      return client.close()
        .then(assert.fail, err => {
          assert.strictEqual(err, closeError);
        });
    });

    it('calls close on the channel', () => {
      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906', '1111').then(() => {
        client.set = sinon.spy();

        return client.close()
          .then(() => {
            assert.isTrue(client.set.calledOnceWith('isConnected', false));
            assert.isTrue(client.channel.close.calledOnce);
          });
      });
    });
  });

  describe('send', () => {
    beforeEach(() => {
      client = new PairingChannelClient({}, {
        importPairingChannel: mockPairingChannel
      });
    });

    it('rejects if no socket', () => {
      delete client.channel;
      return client.send('message')
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'NOT_CONNECTED'));
        });
    });

    it('rejects if no message', () => {
      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906', '1111')
        .then(() => {
          return client.send();
        })
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'INVALID_OUTBOUND_MESSAGE'));
        });
    });

    it('throws if not connected', () => {
      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906', '1111')
        .then(() => {
          client.set('isConnected', false);
          return client.send('message');
        })
        .then(assert.fail, err => {
          assert.isTrue(PairingChannelClientErrors.is(err, 'NOT_CONNECTED'));
          assert.isFalse(client.channel.send.calledOnce);
        });
    });

    it('sends data over', () => {
      const testData = {data: true};

      return client.open('wss://channel.server.url/', 'c05d62ed4e1445089e9e2a33d148f906', '1111')
        .then(() => {
          return client.send('message', testData);
        })
        .then(() => {
          assert.isFalse(client.channel.send.calledOnceWith('message', testData));
        });
    });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!path',
  'intern/dojo/node!proxyquire'
], function (registerSuite, assert, path, proxyquire) {
  const getConnection = proxyquire(
    path.join(process.cwd(), 'server', 'lib', 'utils', 'parse-connection'),
    {
      '../configuration': {
        getProperties: () => ({clientAddressDepth: 2})
      }
    }
  );

  registerSuite({
    name: 'get client address',

    'gets ip from the right depth': function () {
      const mockReq = {
        headers: {
          'x-forwarded-for': 'fakeIp, realIp'
        },
        ip: 'anotherIp'
      };
      const res = getConnection(mockReq);
      assert.equal(res.clientAddress, 'realIp');
      assert.deepEqual(res.remoteAddressChain, ['fakeIp', 'realIp', 'anotherIp']);
    },

    'filters badly formed headers': function () {
      const mockReq = {
        headers: {
          'x-forwarded-for': 'fakeIp, ,realIp'
        },
        ip: 'anotherIp'
      };
      const res = getConnection(mockReq);
      assert.equal(res.clientAddress, 'realIp');
      assert.deepEqual(res.remoteAddressChain, ['fakeIp', 'realIp', 'anotherIp']);
    },

    'uses remote address if ip is missing': function () {
      const mockReq = {
        connection: {
          remoteAddress: 'remoteAddressIp'
        },
        headers: {
          'x-forwarded-for': ''
        }
      };
      const res = getConnection(mockReq);
      assert.equal(res.clientAddress, 'remoteAddressIp');
      assert.deepEqual(res.remoteAddressChain, ['remoteAddressIp']);
    }
  });
});

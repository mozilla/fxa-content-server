/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var assert = require('chai').assert;
  var AttachedClients = require('models/attached-clients');
  var Notifier = require('lib/channels/notifier');
  var Constants = require('lib/constants');

  describe('models/attached-clients', function () {
    var attachedClients;
    var notifier;

    beforeEach(function () {
      notifier = new Notifier();

      attachedClients = new AttachedClients([], {
        notifier: notifier
      });
    });

    describe('properly orders the attached clients', function () {
      var now = Date.now();

      beforeEach(function () {
        attachedClients.set([
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            isCurrentDevice: false,
            lastAccessTime: null,
            name: 'xi'
          },
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            isCurrentDevice: false,
            lastAccessTime: null,
            name: 'xi'
          },
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            isCurrentDevice: true,
            lastAccessTime: now - 20,
            name: 'zeta'
          },
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            isCurrentDevice: false,
            lastAccessTime: now - 10,
            name: 'mu'
          },
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            isCurrentDevice: false,
            lastAccessTime: now,
            name: 'tau'
          },
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            isCurrentDevice: false,
            lastAccessTime: now,
            name: 'sigma'
          },
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            isCurrentDevice: false,
            lastAccessTime: now - 20,
            name: 'theta'
          },
          {
            clientType: Constants.CLIENT_TYPE_OAUTH_APP,
            isCurrentDevice: false,
            lastAccessTime: null,
            name: 'an oauth'
          }
        ]);
      });

      it('places the `current` device first', function () {
        assert.equal(attachedClients.at(0).get('name'), 'zeta');
      });

      it('sorts those with lastAccessTime next, by access time (descending)', function () {
        assert.equal(attachedClients.at(1).get('name'), 'sigma');
        assert.equal(attachedClients.at(2).get('name'), 'tau');
        assert.equal(attachedClients.at(3).get('name'), 'mu');
        assert.equal(attachedClients.at(4).get('name'), 'theta');

      });

      it('sorts the rest alphabetically', function () {
        assert.equal(attachedClients.at(5).get('name'), 'an oauth');
        assert.equal(attachedClients.at(6).get('name'), 'xi');
        assert.equal(attachedClients.at(7).get('name'), 'xi');
      });
    });

    describe('device name change', function () {
      beforeEach(function () {
        attachedClients.set([
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            id: 'device-1',
            isCurrentDevice: false,
            name: 'zeta'
          },
          {
            clientType: Constants.CLIENT_TYPE_DEVICE,
            id: 'device-2',
            isCurrentDevice: true,
            name: 'upsilon'
          }
        ]);
      });
    });
  });
});


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var assert = require('chai').assert;
  var Apps = require('models/apps');
  var Notifier = require('lib/channels/notifier');

  describe('models/apps', function () {
    var apps;
    var notifier;

    beforeEach(function () {
      notifier = new Notifier();

      apps = new Apps([], {
        notifier: notifier
      });
    });

    describe('lists apps', function () {
      assert.ok(apps);
    });

  });
});


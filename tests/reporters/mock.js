/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern/node_modules/dojo/has!host-node?intern/node_modules/dojo/node!fxa-content-mocks'
], function (intern, FxaMocks) {
  'use strict';

  var recorder;

  return {
    '/runner/start': function () {
      console.log('Runner started');

      if (FxaMocks) {
        recorder = new FxaMocks.Recorder([
            {
              hostTarget: 'http://127.0.0.1:9000/v1',
              proxyPort: 10500
            },
            {
              hostTarget: 'http://127.0.0.1:9001',
              proxyPort: 10501
            }
          ],
          {
            directory: 'tests/mocks'
          });
      }

    },
    '/runner/end': function () {
      console.log('Runner ended');
      if (FxaMocks) {
        recorder.close();
        process.exit(0);
      }
    },
    '/error': function (err) {
      throw err;
    },
    '/suite/start': function (test) {
      console.log(test.name + ' started');
    },
    '/suite/end': function (test) {
      console.log(test.name + ' ended');
      if (FxaMocks) {
        recorder.recordMockStop(test);
      }
    }
  };
});

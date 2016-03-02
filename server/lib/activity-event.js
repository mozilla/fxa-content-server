/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var config = require('./configuration');
var log = require('mozlog').config({
  app: 'fxa-content-server',
  format: 'heka',
  stream: process.stderr
});

var activityEventSampleRate = config.get('activity_events.sample_rate');

module.exports = function (event, data, request, queryParams) {
  if (! shouldEmitActivityEvent()) {
    return;
  }

  data.event = event;
  data.userAgent = request.headers['user-agent'];

  if (queryParams) {
    queryParams.forEach(function (param) {
      data[param] = request.query[param];
    });
  }

  setImmediate(function () {
    log.info('activityEvent', data);
  });
};

function shouldEmitActivityEvent () {
  return Math.random() < activityEventSampleRate;
}


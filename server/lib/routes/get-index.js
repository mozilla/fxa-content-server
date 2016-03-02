/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');
var config = require('../configuration');

var activityEventSampleRate = config.get('activity_events.sample_rate');
var activityEventQueryParams = [
  'context',
  'entrypoint',
  'migration',
  'service',
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term'
];

module.exports = function () {
  var route = {};
  route.method = 'get';
  route.path = '/';

  route.process = function (req, res) {
    if (! shouldEmitActivityEvent()) {
      return res.render('index');
    }

    var time = Date.now();
    var flowId = crypto.randomBytes(16).toString('hex');
    res.render('index', { flowBeginTime: time, flowId: flowId });

    setImmediate(function () {
      // This event data is structured to be consistent with the auth server
      // activity events. So yes, the format is different to the content server
      // log lines. And yes, there is a mix of camelCase and under_score keys.
      var activityEvent = {
        device_id: null, //eslint-disable-line camelcase
        event: 'flow.begin',
        flow_id: flowId, //eslint-disable-line camelcase
        flow_time: 0, //eslint-disable-line camelcase
        new_user: false, //eslint-disable-line camelcase
        time: time,
        uid: null,
        userAgent: req.headers['user-agent']
      };
      activityEventQueryParams.forEach(function (key) {
        activityEvent[key] = req.query[key] || null;
      });
      // The data pipeline only reads from stderr.
      process.stderr.write('activityEvent ' + JSON.stringify(activityEvent) + '\n');
    });
  };

  return route;
};

function shouldEmitActivityEvent () {
  return Math.random() < activityEventSampleRate;
}


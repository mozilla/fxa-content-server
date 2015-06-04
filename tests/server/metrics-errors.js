/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/node!request'
], function (intern, registerSuite, assert, config, request) {
  var serverUrl = intern.config.fxaContentRoot.replace(/\/$/, '');

  var metricsSampleRate = config.get('sentry.sample_rate');

  var suite = {
    name: 'metrics-errors'
  };

  suite['#get /config returns Sentry sample_rate'] = function () {
    var dfd = this.async(intern.config.asyncTimeout);

    request(serverUrl + '/config',
    dfd.callback(function (err, res) {
      var results = JSON.parse(res.body);

      assert.equal(results.sentrySampleRate, metricsSampleRate);
    }, dfd.reject.bind(dfd)));
  };

  suite['#get /metrics-errors - returns 200 without query'] = function () {
    var dfd = this.async(intern.config.asyncTimeout);

    request.get(serverUrl + '/metrics', dfd.callback(function (err, res) {
      assert.equal(res.statusCode, 200);
    }, dfd.reject.bind(dfd)));
  };

  suite['#get /metrics-errors - returns 200 with an error query'] = function () {
    var dfd = this.async(intern.config.asyncTimeout);

    request.get(serverUrl + '/metrics?sentry_version=4', dfd.callback(function (err, res) {
      assert.equal(res.statusCode, 200);
    }, dfd.reject.bind(dfd)));
  };

  registerSuite(suite);
});

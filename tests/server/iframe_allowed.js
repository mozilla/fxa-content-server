/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/node!request'
], function (registerSuite, assert, config, request) {
  'use strict';

  var serverUrl = config.get('public_url');

  var suite = {
    name: 'metrics'
  };

  suite['#get /iframe_allowed/ with an allowed origin returns a `isIframeAllowed: true`'] = function () {
    var dfd = this.async(1000);

    var allowedOrigin = encodeURIComponent(config.get('iframe_allowed_origins')[0]);

    request(serverUrl + '/iframe_allowed/' + allowedOrigin,
    dfd.callback(function (err, res) {
      assert.equal(res.statusCode, 200);

      var results = JSON.parse(res.body);
      assert.isTrue(results.isIframeAllowed);
    }, dfd.reject.bind(dfd)));
  };

  suite['#get /iframe_allowed/ with a disallowed origin returns a `isIframeAllowed: false`'] = function () {
    var dfd = this.async(1000);

    request(serverUrl + '/iframe_allowed/' + encodeURIComponent('http://not-allowed.org'),
    dfd.callback(function (err, res) {
      assert.equal(res.statusCode, 200);

      var results = JSON.parse(res.body);
      assert.isFalse(results.isIframeAllowed);
    }, dfd.reject.bind(dfd)));
  };

  registerSuite(suite);
});

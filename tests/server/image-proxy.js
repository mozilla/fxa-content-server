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

  var httpsUrl = config.get('public_url');
  var imageUrl = 'http://upload.wikimedia.org/wikipedia/meta/b/be/Wikipedia-logo-v2_2x.png';

  var suite = {
    name: 'image proxy'
  };

  suite['#get remote image returns 404 on non-existent image'] = function () {
    var dfd = this.async(1000);
    var badImageUrl = 'http://example.com/does/no/exist.jpg';

    request(httpsUrl + '/remote-image/' + encodeURIComponent(badImageUrl), {}, dfd.callback(function (err, res) {

      assert.equal(res.statusCode, 404);

    }, dfd.reject.bind(dfd)));
  };

  suite['#get remote image returns 404 without referer header'] = function () {
    var dfd = this.async(1000);

    request(httpsUrl + '/remote-image/' + encodeURIComponent(imageUrl), {}, dfd.callback(function (err, res) {

      assert.equal(res.statusCode, 404);

    }, dfd.reject.bind(dfd)));
  };

  suite['#get remote image returns 404 without invalid referer'] = function () {
    var dfd = this.async(1000);

    request(httpsUrl + '/remote-image/' + encodeURIComponent(imageUrl), {
      headers: {
        'Referer': 'http://example.com'
      }
    }, dfd.callback(function (err, res) {

      assert.equal(res.statusCode, 404);

    }, dfd.reject.bind(dfd)));
  };

  suite['#get remote image with valid referer'] = function () {
    var dfd = this.async(1000);

    request(httpsUrl + '/remote-image/' + encodeURIComponent(imageUrl), {
      headers: {
        'Referer': httpsUrl
      }
    }, dfd.callback(function (err, res) {

      assert.equal(res.statusCode, 200);

    }, dfd.reject.bind(dfd)));
  };

  registerSuite(suite);
});

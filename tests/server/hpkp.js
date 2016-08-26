/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/node!../../server/lib/hpkp',
  'intern/dojo/node!request'
], function (intern, registerSuite, assert, config, hpkp, request) {
  var serverUrl = intern.config.fxaContentRoot.replace(/\/$/, '');
  var suite = {
    name: 'hpkp'
  };

  suite['#get sends hpkp headers'] = function () {
    var dfd = this.async(intern.config.asyncTimeout);
    var headerValue = hpkp.buildHPKPHeader(config.get('hpkp_config.max_age'),
      config.get('hpkp_config.pin_sha256'),
      config.get('hpkp_config.includeSubDomains'));

    request(serverUrl + '/', {},
    dfd.callback(function (err, res) {
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['public-key-pins'], headerValue);
    }, dfd.reject.bind(dfd)));
  };

  registerSuite(suite);
});

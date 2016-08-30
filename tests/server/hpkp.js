/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/node!request'
], function (intern, registerSuite, assert, config, request) {
  var serverUrl = intern.config.fxaContentRoot.replace(/\/$/, '');
  var suite = {
    name: 'hpkp'
  };

  suite['#get sends hpkp headers'] = function () {
    var dfd = this.async(intern.config.asyncTimeout);
    var headerValue = 'pin-sha256="5kJvNEMw0KjrCAu7eXY5HZdvyCS13BbA0VJG1RSP91w="; ' +
      'pin-sha256="PZXN3lRAy+8tBKk2Ox6F7jIlnzr2Yzmwqc3JnyfXoCw="; ' +
      'pin-sha256="r/mIkG3eEpVdm+u/ko/cwxzOMo1bk4TyHIlByibiA5E="; ' +
      'max-age=0; includeSubdomains';

    request(serverUrl + '/', {},
    dfd.callback(function (err, res) {
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['public-key-pins'], headerValue);
    }, dfd.reject.bind(dfd)));
  };

  registerSuite(suite);
});

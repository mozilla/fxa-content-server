/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (config) {
  var route = {};
  route.method = 'get';
  route.path = '/.well-known/fxa-client-configuration';

  var fxaClientConfig = {
    /*eslint-disable camelcase */
    auth_server_endpoint: config.get('fxaccount_url') + '/v1',
    oauth_server_endpoint: config.get('oauth_url') + '/v1',
    profile_server_endpoint: config.get('profile_url') + '/v1',
  };

  route.process = function (req, res) {

    // These values houldn't change often, but might occasionally.
    res.header('Cache-Control', 'public, max-age=3600');

    // charset must be set on json responses.
    res.charset = 'utf-8';

    res.json(fxaClientConfig);
  };

  return route;
};

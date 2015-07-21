/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// OAuth client info for the given client id

// XXX - could probably just use the oauth client for this.

const request = require('request');
const Promise = require('bluebird');

module.exports = function (oAuthUrl) {
  var clientInfoCache = {};

  // TODO should probably ensure oAuthUrl does not already end in a /
  var CLIENT_INFO_URL_BASE = oAuthUrl + '/v1/client/';

  return {
    getClientInfo: function (clientId) {
      if (clientInfoCache[clientId]) {
        return Promise.resolve(clientInfoCache[clientId]);
      }

      var resolver = Promise.defer();

      request.get({
        url: CLIENT_INFO_URL_BASE + clientId
      }, function (err, _, body) {
        if (err) {
          return resolver.reject(err);
        }

        if (body.code >= 400) {
          return resolver.reject(new Error('Unauthorized'));
        }

        console.error('body!', body);
        var clientInfo = JSON.parse(body);
        clientInfoCache[clientId] = clientInfo;
        resolver.resolve(clientInfo);
      });

      return resolver.promise;
    }
  };
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');

module.exports = function (config) {
  var STATIC_RESOURCE_URL = config.get('static_resource_url');
  var CONTENT_TOKEN_KEY = config.get('content_token_key');

  var route = {};
  route.method = 'get';
  route.path = '/';

  route.process = function (req, res) {
    var contentTokenContent = req.ip + req.headers['user-agent'];
    var contentToken = crypto.createHmac('sha1', CONTENT_TOKEN_KEY).update(contentTokenContent).digest('hex');

    res.render('index', {
      contentToken: contentToken,
      staticResourceUrl: STATIC_RESOURCE_URL
    });
  };

  return route;
};


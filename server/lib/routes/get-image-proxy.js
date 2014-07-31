/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var request = require('request');
var logger = require('intel').getLogger('image.proxy');
var config = require('../configuration');

function proxy (req, res, next) {
  var imgUrl = req.params.imageUrl;
  // Restrict the proxy to requests from our own pages
  if (!req.headers.referer || req.headers.referer.indexOf(config.get('public_url')) !== 0) {
    return res.send(404);
  }

  logger.info('proxying image: %s', imgUrl);

  request(imgUrl).pipe(res)
    .on('error', function (e) {
      logger.error('proxy error: %s', String(e));

      res.send(404);
    });
};

module.exports = function () {
  var route = {};
  route.method = 'get';
  route.path = '/remote-image/:imageUrl';

  route.process = proxy;

  return route;
}


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var config = require('../configuration');
var ALLOWED_ORIGINS = config.get('iframe_allowed_origins');
var logger = require('intel').getLogger('route.get_iframe_allowed');

module.exports = function () {
  var route = {};
  route.method = 'get';
  route.path = '/iframe_allowed/:origin';

  route.process = function(req, res) {
    var origin = decodeURIComponent(req.params.origin || '');
    var isIframeAllowedForOrigin = origin && ALLOWED_ORIGINS.indexOf(origin) > -1;

    if (! isIframeAllowedForOrigin) {
      logger.warn('illegal attempt to iframe: %s', origin);
    }

    res.json({
      isIframeAllowed: isIframeAllowedForOrigin
    });
  };

  return route;
};

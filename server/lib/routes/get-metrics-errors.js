/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var logger = require('mozlog')('server.metrics-errors');
var request = require('request');

var config = require('../configuration');
var sentryConfig = config.get('sentry');

var API_KEY = sentryConfig.api_key;

/**
 * Reports errors to Sentry
 * @param {String} url
 *          Url from the error request.
 */
function reportError(url) {
  var indexOfQuery = url.indexOf('?');

  if (sentryConfig && API_KEY && indexOfQuery >= 0) {
    // send the request to sentry
    var query = url.substr(indexOfQuery + 1);
    // set API_KEY using the server
    query = query.replace('__API_KEY__', API_KEY);

    process.nextTick(function () {
      request(sentryConfig.endpoint + '?' + query, function (err, resp, body) {
        if (err || resp.statusCode !== 200) {
          logger.error(err, body);
        }
      });
    });
  }
}

/**
 * This module serves as an endpoint for front-end errors.
 * The errors are sent to Sentry service for triage.
 *
 * The content server sends a GET request via forked version of raven-js, i.e GET /metrics-errors?sentry_version=4&...
 * The query parameters are forwarded to the appropriate Sentry metrics dashboard.
 *
 * @returns {{method: string, path: string, process: Function}}
 */
module.exports = function () {

  return {
    method: 'get',
    path: '/metrics-errors',
    process: function (req, res) {
      // respond right away
      res.json({ success: true });

      reportError(req.url);
    }
  };
};

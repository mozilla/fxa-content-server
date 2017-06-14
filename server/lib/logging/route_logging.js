/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// Middleware to log the requests

const logger = require('mozlog')('server.requests');
const morgan = require('morgan');
const config = require('../configuration');

/**
 * Enhances connect logger middleware - custom formats.
 * See lib/configuration for usage.
 */

// Used when logging is disabled
const disabled = function (req, res, next) {
  next();
};

const formats = {
  'default_fxa': (tokens, req, res) => JSON.stringify({
    'content-length': tokens.res(req, res, 'content-length'),
    HTTP: req.httpVersion,
    method: tokens.method(req, res),
    path: tokens.url(req, res),
    referrer: req.headers['referer'],
    'remote-addr': req.ip || req.connection.remoteAddress,
    'response-time': tokens['response-time'](req, res),
    status: tokens.status(req, res),
    'user-agent': req.headers['user-agent']
  }),
  'dev_fxa': (tokens, req, res) => [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens['response-time'](req, res),
    tokens.status(req, res)
  ].join(' ')
};

function loggerHeka(x) {
  if (config.get('route_log_format') === 'dev_fxa') {
    return logger.info('route', x.trim());
  }
  return logger.info('route',  JSON.parse(x));
}

module.exports = function () {
  return config.get('disable_route_logging') ?
          disabled :
          morgan(formats[config.get('route_log_format')], {
            stream: {
              write: loggerHeka
            }
          });
};

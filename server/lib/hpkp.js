/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Wrapper for Helment HPKP middleware. Instead of using Helmet directly,
 * we can add some extra logic checks if needed. This follows similar pattern as CSP.
 */

var helmet = require('helmet');

module.exports = function (config) {
  var hpkpMiddleware = helmet.hpkp({
    includeSubdomains: config.get('hpkpConfig.includeSubDomains'),
    maxAge: config.get('hpkpConfig.maxAge') * 1000, // Convert to seconds
    reportOnly: config.get('hpkpConfig.reportOnly'),
    reportUri: config.get('hpkpConfig.reportUri'),
    sha256s: config.get('hpkpConfig.sha256s')
  });

  return function (req, res, next) {
    if (! config.get('hpkpConfig.enabled')) {
      return next();
    }

    hpkpMiddleware(req, res, next);
  };
};

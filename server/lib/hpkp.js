/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Middleware to build and append HPKP headers.

function buildHPKPHeader(maxAge, pins, includeSubdomain) {
  var hpkpHeader = 'max-age=' + maxAge + '; ';

  if (includeSubdomain) {
    hpkpHeader = hpkpHeader + 'includeSubDomains; '
  }

  pins.forEach(function (pinSha) {
    hpkpHeader = hpkpHeader + 'pin-sha256=\"' + pinSha + '\"; '
  });

  return hpkpHeader.trim();
}

module.exports = function (maxAge, pins, includeSubdomain) {

  var hpkpHeader = buildHPKPHeader(maxAge, pins, includeSubdomain);

  return function (req, res, next) {

    res.setHeader('Public-Key-Pins', hpkpHeader);

    return next();
  };
};

module.exports.buildHPKPHeader = buildHPKPHeader;

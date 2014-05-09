/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var cachify = require('connect-cachify');

module.exports = function (req, res, next) {
  var stylesheetUrl = '/styles/localized/' + req.lang + '.css';

  // cachify is set up as middleware in `/server/bin/fxa-content-server.js`
  res.locals({
    'stylesheet': cachify.cachify_css(stylesheetUrl)
  });
  next();
};


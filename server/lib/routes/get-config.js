/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function () {
  var route = {};

  // support for this route was removed in PR #4147, config
  // is written to the DOM instead. This route had a high
  // failure rate, and avoiding the request speeds up
  // load time.

  route.method = 'get';
  route.path = '/config';

  route.process = function (req, res) {
    res.status(410).send('gone');
  };

  return route;
};


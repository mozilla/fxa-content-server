/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var config = require('../configuration')

module.exports = function () {
	var abUrl = config.get('ab_url') + '/experiments.bundle.js'
  var route = {};
  route.method = 'get';
  route.path = '/';

  route.process = function (req, res) {
    res.render('index', {
    	ab_url: abUrl
    });
  };

  return route;
};


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (config) {
  var STATIC_RESOURCE_URL = config.get('static_resource_url');

  return {
    method: 'get',
    path: '/400.html',
    process: function (req, res) {
      res.removeHeader('x-frame-options');

      // The front end will set a message session cookie. If
      // no cookie exists, default to `Unexpected error`.
      // Clear the cookie afterwards so the error message does
      // not re-appear in error.
      var message = (req.cookies && req.cookies.message) ||
                     req.gettext('Unexpected error');

      res.clearCookie('message', { path: '/400.html' });

      return res.render('400', {
        message: message,
        staticResourceUrl: STATIC_RESOURCE_URL
      });
    }
  };
};


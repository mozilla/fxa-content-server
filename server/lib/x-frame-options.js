/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const OAuthClientInfo = require('./oauth-client-info');
const url = require('url');

module.exports = function (config) {
  var oAuthClientInfo = new OAuthClientInfo(config.get('oauth_url'));
  var allowedParents = config.get('allowed_parent_origins');

  return function (req, res, next) {
    // only HTML files need the x-frame-header option.
    if (! /text\/html/.test(req.get('accept'))) {
      next();
      return;
    }

    var HEADER_NAME = 'X-Frame-Options';
    function allowFrom(origin) {
      res.setHeader(HEADER_NAME, 'ALLOW-FROM ' + origin);
    }

    function deny() {
      res.setHeader(HEADER_NAME, 'DENY');
    }

    if (req.query.client_id && req.query.context === 'iframe') {
      oAuthClientInfo.getClientInfo(req.query.client_id)
        .then(function (clientInfo) {
          const parsedUrl = url.parse(clientInfo.redirect_uri);
          const origin = parsedUrl.protocol + '//' + parsedUrl.host;
          allowFrom(origin);
          next();
        });
      return;
    } else if (req.query.service === 'sync' && req.query.context === 'iframe') {
      // this is based on the scheme proposed on RFC 7034
      // - https://tools.ietf.org/html/rfc7034#section-2.3.2.3
      // The RFC actually recommends the relier send a query parameter
      // since some browsers do not send referrer.
      var referrer = req.get('referrer').replace(/\/$/, '');
      if (referrer && allowedParents.indexOf(referrer) > -1) {
        allowFrom(referrer);
        next();
        return;
      }
    }

    // Deny by default. If there is an OAuth client id, then
    // go look up the client's info and create a valid origin.
    //
    // If embedded into a native Firefox chrome iframe, x-frame-options
    // will be ignored anyway.
    deny();
    next();
  };
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const url = require('url');

const logger = require('../logging/log')('server.get-authorization');

const ACTION_TO_PATHNAMES = {
  'email': '',
  'force_auth': 'force_auth',
  'signin': 'signin',
  'signup': 'signup'
};

function actionToPathname(action) {
  if (action === undefined) {
    return '';
  }

  if (ACTION_TO_PATHNAMES.hasOwnProperty(action)) {
    return ACTION_TO_PATHNAMES[action];
  }

  throw new Error('Bad action parameter');
}

module.exports = function () {
  return {
    method: 'get',
    path: '/authorization',
    process: function (req, res) {
      let err = false;
      const route = url.parse('/', true);

      try {
        route.pathname += actionToPathname(req.query.action);
      } catch (e) {
        err = true;
        logger.error('Invalid request parameter', req.query.action);
        return res.send(500, 'Invalid request parameter ' + req.query.action)  ;
      }

      if (! err) {
        if (req.query.action !== 'email') {
          // only `action=email` is propagated as a hint
          // to the content server to show the email-first
          // flow. All other actions return a named
          // endpoint.
          delete req.query.action;
        }

        if (req.query.login_hint && ! req.query.email) {
          req.query.email = req.query.login_hint;
          delete req.query.login_hint;
        }

        route.query = req.query;

        delete route.search;
        delete route.path;
        return url.format(route);
      }
    }
  };
};

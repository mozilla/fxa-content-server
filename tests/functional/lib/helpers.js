/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'require',
  'tests/lib/restmail',
  'intern/dojo/node!leadfoot/helpers/pollUntil',
  'intern/dojo/node!url',
  'intern/dojo/node!querystring'
], function (intern, require, restmail, pollUntil, url, querystring) {
  'use strict';

  var config = intern.config;
  var CONTENT_SERVER = config.fxaContentRoot;
  var EMAIL_SERVER_ROOT = config.fxaEmailRoot;

  function clearBrowserState(context) {
    // clear localStorage to avoid polluting other tests.
    return context.get('remote')
      // always go to the content server so the browser state is cleared
      .setFindTimeout(config.pageLoadTimeout)
      .getCurrentUrl()
      .then(function (url) {
        // only load up the content server if we aren't
        // already at the content server.
        if (url.indexOf(CONTENT_SERVER) === -1) {
          return context.get('remote').get(toUrl(CONTENT_SERVER));
        }
      })
      .execute(function () {
        try {
          /* global document, localStorage, sessionStorage */
          localStorage.clear();
          sessionStorage.clear();
          document.cookie = 'tooyoung=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
        } catch(e) {
          console.log('Failed to clearBrowserState');
          // if cookies are disabled, this will blow up some browsers.
        }
        return true;
      }, []);
  }

  function clearSessionStorage(context) {
    // clear localStorage to avoid polluting other tests.
    return context.get('remote')
      .execute(function () {
        try {
          /* global sessionStorage */
          sessionStorage.clear();
        } catch(e) {
          console.log('Failed to clearSessionStorage');
        }
        return true;
      }, []);
  }

  /**
   * Use document.querySelectorAll to find visible elements
   * used for error and success notification animations.
   *
   * Usage:  ".then(FunctionalHelpers.visibleByQSA('.success'))"
   *
   * @param {String} selector
   *        QSA compatible selector string
   */
  function visibleByQSA(selector) {
    return pollUntil(function (selector) {
      /* global document */
      var match = document.querySelectorAll(selector);

      if (match.length > 1) {
        throw new Error('Multiple elements matched. Make a more precise selector');
      }

      return match[0] && match[0].offsetWidth > 0 ? true : null;
    }, [ selector ], 10000);
  }

  function getVerificationLink(user, index) {
    return restmail(EMAIL_SERVER_ROOT + '/mail/' + user)
      .then(function (emails) {
        return require.toUrl(emails[index].headers['x-link']);
      });
  }

  /**
   * Convert the URL to something usable by the functional tests.
   *
   * @param {string} baseUrl
   * @param {object} options
   * @param {object} options.query - query parameters to add to the baseUrl
   * @return {string} URL that can be loaded in functional tests
   */
  function toUrl(baseUrl, options) {
    if (! (options && options.query)) {
      return require.toUrl(baseUrl);
    }

    var parsed = url.parse(baseUrl);
    var queryParams = querystring.parse(parsed.query);

    for (var key in options.query) {
      queryParams[key] = options.query[key];
    }

    // update the query object with the updated list.
    parsed.query = queryParams;

    // url.format uses parsed.search if it is available. Since
    // we have updated the query parameters, ditch the
    // search string.
    delete parsed.search;

    return require.toUrl(url.format(parsed));
  }

  return {
    clearBrowserState: clearBrowserState,
    clearSessionStorage: clearSessionStorage,
    visibleByQSA: visibleByQSA,
    pollUntil: pollUntil,
    getVerificationLink: getVerificationLink,
    toUrl: toUrl
  };
});

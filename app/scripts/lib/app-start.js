/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// this module starts it all.

/**
 * the flow:
 * 1) Initialize session information from URL search parameters.
 * 2) Fetch /config from the backend, the returned info includes a flag that
 *    indicates whether cookies are enabled.
 * 3) Fetch translations from the backend.
 * 4) Create the web/desktop communication channel.
 * 5) If cookies are disabled, go to the /cookies_disabled page.
 * 6) Start the app if cookies are enabled.
 */

/* exceptsPaths: component!lib/components/close-button, component!lib/components/height-observer */
define([
  'lib/promise',
  'raven',
  'lib/url',
  'lib/sentry',
  'lib/constants',
  'lib/oauth-errors',
  'component!lib/components/translator',
  'component!lib/components/metrics',
  'component!lib/components/height-observer',
  'component!lib/components/close-button',
  'component!lib/components/router',
  'component!lib/components/error-metrics',
  'component!lib/components/storage',
  'component!lib/components/window',
  'component!lib/components/history',
  'component!lib/components/context',
],
function (
  p,
  Raven,
  Url,
  SentryMetrics,
  Constants,
  OAuthErrors,
  translator,
  metrics,
  heightObserver,
  closeButton,
  router,
  sentryMetrics,
  storage,
  window,
  history,
  context
) {
  'use strict';

  // delay before redirecting to the error page to
  // ensure metrics are reported to the backend.
  var ERROR_REDIRECT_TIMEOUT = 1000;

  function Start() {
  }

  Start.prototype = {
    startApp: function () {
      var self = this;
      window.router = router;

      return p(this.allResourcesReady())
      .fail(function (err) {
        if (console && console.error) {
          console.error('Critical error:');
          console.error(String(err));
        }

        // if there is no error metrics set that means there was probably an error with app start
        // therefore force error reporting to get error information
        if (! sentryMetrics) {
          self.enableSentryMetrics();
        }

        Raven.captureException(err);

        if (metrics) {
          metrics.logError(err);
        }

        // this extra promise is to ensure the message is printed
        // to the console in Firefox before redirecting. Without
        // the delay, the console message is lost, even with
        // persistent logs enabled. See #2183
        return p()
          .then(function () {
            // give a bit of time to flush the error logs,
            // otherwise Safari Mobile redirects too quickly.
            window.setTimeout(function () {
              //Something terrible happened. Let's bail.
              var redirectTo = self._getErrorPage(err);
              window.location.href = redirectTo;
            }, ERROR_REDIRECT_TIMEOUT);
          });
      });
    },

    enableSentryMetrics: function () {
      this._sentryMetrics = new SentryMetrics(window.location.host);
    },

    allResourcesReady: function () {
      // The IFrame cannot use pushState or else a page transition
      // would cause the parent frame to redirect.
      var usePushState = ! context.isInAnIframe();

      if (! usePushState) {
        // If pushState cannot be used, Backbone falls back to using
        // the hashchange. Put the initial pathname onto the hash
        // so the correct page loads.
        window.location.hash = window.location.pathname;
      }

      // If a new start page is specified, do not attempt to render
      // the route displayed in the URL because the user is
      // immediately redirected
      var startPage = this._selectStartPage();
      var isSilent = !! startPage;
      history.start({ pushState: usePushState, silent: isSilent });
      if (startPage) {
        router.navigate(startPage);
      }
    },

    _getErrorPage: function (err) {
      if (OAuthErrors.is(err, 'MISSING_PARAMETER') ||
          OAuthErrors.is(err, 'UNKNOWN_CLIENT')) {
        var queryString = Url.objToSearchString({
          message: OAuthErrors.toInterpolatedMessage(err, translator),
          errno: err.errno,
          namespace: err.namespace,
          context: err.context,
          param: err.param,
          client_id: err.client_id //eslint-disable-line camelcase
        });

        return Constants.BAD_REQUEST_PAGE + queryString;
      }

      return Constants.INTERNAL_ERROR_PAGE;
    },

    _selectStartPage: function () {
      if (window.location.pathname !== '/cookies_disabled' &&
        ! storage.isLocalStorageEnabled(window)) {
        return 'cookies_disabled';
      }
    }
  };

  return Start;
});

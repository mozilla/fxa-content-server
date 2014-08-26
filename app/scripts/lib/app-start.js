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
 * 6) If the app is illegally iframed, go to the /illegal_iframe page.
 * 7) Start the app on prerequisite success.
 */

'use strict';

define([
  'underscore',
  'backbone',
  'lib/promise',
  'router',
  'lib/translator',
  'lib/session',
  'lib/url',
  'lib/channels',
  'lib/config-loader',
  'lib/metrics',
  'lib/null-metrics',
  'lib/auth-errors',
  'views/close_button'
],
function (
  _,
  Backbone,
  p,
  Router,
  Translator,
  Session,
  Url,
  Channels,
  ConfigLoader,
  Metrics,
  NullMetrics,
  AuthErrors,
  CloseButtonView
) {



  function isMetricsCollectionEnabled (sampleRate) {
    return Math.random() <= sampleRate;
  }

  function createMetrics(sampleRate, options) {
    if (isMetricsCollectionEnabled(sampleRate)) {
      return new Metrics(options);
    }

    return new NullMetrics();
  }

  function Start(options) {
    options = options || {};

    this._window = options.window || window;
    this._router = options.router;

    this._history = options.history || Backbone.history;
    this._configLoader = new ConfigLoader();
    this._channel = options.channel;
  }

  Start.prototype = {
    startApp: function () {
      this.initSessionFromUrl();

      // fetch both config and translations in parallel to speed up load.
      return p.all([
          this.checkEnvironment(),
          this.initializeConfig(),
          this.initializeL10n(),
          this.initializeCloseButton()
        ])
        .then(_.bind(this.checkCookiesEnabled, this))
        .then(_.bind(this.initializationSuccess, this),
              _.bind(this.initializationError, this));
    },

    initializeConfig: function () {
      var self = this;
      return this._configLoader.fetch()
          .then(function (config) {
            self._config = config;
            self._configLoader.useConfig(config);
            Session.set('config', config);

            self._metrics = createMetrics(config.metricsSampleRate, {
              lang: config.language
            });
            self._metrics.init();

            if (! self._router) {
              self._router = new Router({
                metrics: self._metrics,
                language: config.language
              });
            }
            self._window.router = self._router;
          });
    },

    checkCookiesEnabled: function () {
      return this._configLoader.areCookiesEnabled()
          .then(function (areCookiesEnabled) {
            if (! areCookiesEnabled) {
              throw AuthErrors.toError('COOKIES_DISABLED');
            }
          });
    },

    initializeL10n: function () {
      var translator = this._window.translator = new Translator();
      return translator.fetch();
    },

    queryChannel: function (command, data) {
      return Channels.sendExpectResponse(command, data || {}, {
        window: this._window,
        channel: this._channel
      });
    },

    /**
     * Check the channel to see if the environment is acceptable.
     * Used for the IFRAME channel to determine whether the origin
     * is allowed to use the IFRAME'd FxA.
     */
    checkEnvironment: function () {
      return this.queryChannel('check_environment');
    },

    // XXX - does this belong here?
    _selectFxDesktopStartPage: function () {
      // Firefox for desktop native=>FxA glue code.
      var self = this;
      return this.queryChannel('session_status', {})
          .then(function (response) {
            // Don't perform any redirection if a pathname is present
            var canRedirect = self._window.location.pathname === '/';
            if (response && response.data) {
              Session.set('email', response.data.email);
              if (! Session.forceAuth && canRedirect) {
                self._router.navigate('settings', { trigger: true });
              }
            } else {
              Session.clear();
              if (canRedirect) {
                self._router.navigate('signup', { trigger: true });
              }
            }
          });
    },

    initializeCloseButton: function () {
      // The close button view is always created but
      // is only visible if FxA is iframed.
      var closeButtonView = new CloseButtonView();
      closeButtonView.render();
    },

    initializationSuccess: function (results) {
      // Get the party started.

      this._history.start({
        pushState: true,
        silent: false
      });

      if (Session.isDesktopContext()) {
        return this._selectFxDesktopStartPage();
      }
    },

    initializationError: function (err) {
      this._history.start({
        pushState: true,
        // silent because the user is immediately redirected and
        // the first route should not be displayed.
        silent: true
      });

      if (AuthErrors.is(err, 'COOKIES_DISABLED')) {
        this._router.navigate('cookies_disabled');
      } else if (AuthErrors.is(err, 'ILLEGAL_IFRAME_PARENT')) {
        this._router.navigate('illegal_iframe');
      } else {
        this._router.navigate('unexpected_error', {
          error: err
        });
      }
    },

    setSessionValueFromUrl: function (paramName, sessionName) {
      var value = Url.searchParam(paramName, this._window.location.search);
      var name = sessionName || paramName;
      if (value) {
        Session.set(name, value);
      } else {
        Session.clear(name);
      }
    },

    initSessionFromUrl: function () {
      this.setSessionValueFromUrl('service');
      this.setSessionValueFromUrl('redirectTo');
      this.setSessionValueFromUrl('context');
      this.initOAuthService();
    },

    // If Session.service hasn't been set,
    // look for the service in the `client_id` parameter.
    initOAuthService: function () {
      if (! Session.service) {
        this.setSessionValueFromUrl('client_id', 'service');
      }
    }
  };

  return Start;
});

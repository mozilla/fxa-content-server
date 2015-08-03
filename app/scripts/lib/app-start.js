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

define([
  'underscore',
  'backbone',
  'diy',
  'lib/promise',
  'router',
  'raven',
  'lib/translator',
  'lib/session',
  'lib/url',
  'lib/config-loader',
  'lib/screen-info',
  'lib/metrics',
  'lib/sentry',
  'lib/storage-metrics',
  'lib/fxa-client',
  'lib/assertion',
  'lib/constants',
  'lib/oauth-client',
  'lib/oauth-errors',
  'lib/auth-errors',
  'lib/profile-client',
  'lib/marketing-email-client',
  'lib/channels/inter-tab',
  'lib/channels/iframe',
  'lib/channels/null',
  'lib/channels/web',
  'lib/storage',
  'lib/able',
  'lib/environment',
  'lib/origin-check',
  'lib/height-observer',
  'models/reliers/relier',
  'models/reliers/oauth',
  'models/reliers/fx-desktop',
  'models/auth_brokers/base',
  'models/auth_brokers/fx-desktop',
  'models/auth_brokers/fx-desktop-v2',
  'models/auth_brokers/first-run',
  'models/auth_brokers/web-channel',
  'models/auth_brokers/redirect',
  'models/auth_brokers/iframe',
  'models/unique-user-id',
  'models/user',
  'models/form-prefill',
  'models/notifications',
  'views/close_button'
],
function (
  _,
  Backbone,
  DIY,
  p,
  Router,
  Raven,
  Translator,
  Session,
  Url,
  ConfigLoader,
  ScreenInfo,
  Metrics,
  SentryMetrics,
  StorageMetrics,
  FxaClient,
  Assertion,
  Constants,
  OAuthClient,
  OAuthErrors,
  AuthErrors,
  ProfileClient,
  MarketingEmailClient,
  InterTabChannel,
  IframeChannel,
  NullChannel,
  WebChannel,
  Storage,
  Able,
  Environment,
  OriginCheck,
  HeightObserver,
  Relier,
  OAuthRelier,
  FxDesktopRelier,
  BaseAuthenticationBroker,
  FxDesktopV1AuthenticationBroker,
  FxDesktopV2AuthenticationBroker,
  FirstRunAuthenticationBroker,
  WebChannelAuthenticationBroker,
  RedirectAuthenticationBroker,
  IframeAuthenticationBroker,
  UniqueUserId,
  User,
  FormPrefill,
  Notifications,
  CloseButtonView
) {
  'use strict';

  function Start(options) {
    options = options || {};

    this._window = options.window || window;

    var self = this;
    this._depList = {
      able: {
        constructor: function () {
          return new Able();
        }
      },
      assertionLibrary: {
        constructor: function (options) {
          return new Assertion({
            fxaClient: options.fxaClient,
            audience: options.config.oAuthUrl
          });
        },
        deps: {
          fxaClient: 'fxaClient',
          config: 'config'
        }
      },
      authenticationBroker: {
        instance: options.broker,
        constructor: function () {
          return self.initializeAuthenticationBroker();
        },
        initialize: 'fetch'
      },
      baseAuthenticationBroker: {
        constructor: BaseAuthenticationBroker,
        deps: {
          relier: 'relier'
        }
      },
      baseRelier: {
        constructor: Relier,
        deps: {
          window: 'window'
        }
      },
      config: {
        constructor: function (options) {
          return options.configLoader._config;
        },
        deps: {
          configLoader: 'configLoader'
        }
      },
      configLoader: {
        constructor: ConfigLoader,
        initialize: 'fetch'
      },
      closeButton: {
        constructor: function (options) {
          var broker = options.broker;
          if (broker.canCancel()) {
            var closeButton = new CloseButtonView({
              broker: broker
            });

            closeButton.render();

            return closeButton;
          }
        },
        deps: {
          broker: 'authenticationBroker'
        }
      },
      errorMetrics: {
        constructor: function (options) {
          return self.initializeErrorMetrics(options);
        },
        deps: {
          able: 'able',
          config: 'config',
          uniqueUserId: 'uniqueUserId'
        }
      },
      firstRunAuthenticationBroker: {
        constructor: FirstRunAuthenticationBroker,
        deps: {
          iframeChannel: 'iframeChannel',
          relier: 'relier',
          window: 'window'
        }
      },
      formPrefill: {
        constructor: FormPrefill
      },
      fxaClient: {
        constructor: function (options) {
          return new FxaClient({
            interTabChannel: options.interTabChannel,
            authServerUrl: options.config.authServerUrl
          });
        },
        deps: {
          config: 'config',
          interTabChannel: 'interTabChannel'
        }
      },
      fxDesktopV1AuthenticationBroker: {
        constructor: FxDesktopV1AuthenticationBroker,
        deps: {
          window: 'window',
          relier: 'relier'
        }
      },
      fxDesktopV2AuthenticationBroker: {
        constructor: FxDesktopV2AuthenticationBroker,
        deps: {
          window: 'window',
          relier: 'relier'
        }
      },
      fxDesktopRelier: {
        constructor: FxDesktopRelier,
        deps: {
          translator: 'translator',
          window: 'window'
        }
      },
      heightObserver: {
        constructor: function (options) {
          if (self._isInAnIframe()) {
            var win = options.window;
            var iframeChannel = options.iframeChannel;

            var heightObserver = new HeightObserver({
              target: win.document.body,
              window: win
            });

            heightObserver.on('change', function (height) {
              iframeChannel.send('resize', { height: height });
            });

            heightObserver.start();

            return heightObserver;
          }
        },
        deps: {
          iframeChannel: 'iframeChannel',
          window: 'window'
        }
      },
      history: {
        instance: options.history || Backbone.history,
      },
      iframeAuthenticationBroker: {
        constructor: IframeAuthenticationBroker,
        deps: {
          window: 'window',
          relier: 'relier',
          assertionLibrary: 'assertionLibrary',
          oAuthClient: 'oAuthClient',
          session: 'session',
          channel: 'iframeChannel',
          metrics: 'metrics'
        }
      },
      iframeChannel: {
        constructor: function (options) {
          return self.initializeIframeChannel(options);
        },
        deps: {
          window: 'window',
          metrics: 'metrics'
        }
      },
      interTabChannel: {
        constructor: InterTabChannel
      },
      metrics: {
        constructor: function (options) {
          var able = options.able;
          var config = options.config;
          var relier = options.relier;
          var win = options.window;
          var uniqueUserId = options.uniqueUserId;

          var isSampledUser = able.choose('isSampledUser', {
            env: config.env,
            uniqueUserId: uniqueUserId
          });

          var screenInfo = new ScreenInfo(win);
          var MetricsConstructor =
             self._isAutomatedBrowser() ? StorageMetrics : Metrics;

          self._metrics = new MetricsConstructor({
            lang: config.language,
            service: relier.get('service'),
            context: relier.get('context'),
            entrypoint: relier.get('entrypoint'),
            migration: relier.get('migration'),
            campaign: relier.get('campaign'),
            clientHeight: screenInfo.clientHeight,
            clientWidth: screenInfo.clientWidth,
            devicePixelRatio: screenInfo.devicePixelRatio,
            screenHeight: screenInfo.screenHeight,
            screenWidth: screenInfo.screenWidth,
            able: able,
            isSampledUser: isSampledUser,
            uniqueUserId: uniqueUserId,
            utmCampaign: relier.get('utmCampaign'),
            utmContent: relier.get('utmContent'),
            utmMedium: relier.get('utmMedium'),
            utmSource: relier.get('utmSource'),
            utmTerm: relier.get('utmTerm')
          });

          return self._metrics;
        },
        initialize: 'init',
        deps: {
          able: 'able',
          config: 'config',
          relier: 'relier',
          window: 'window',
          uniqueUserId: 'uniqueUserId'
        }
      },
      notifications: {
        constructor: Notifications,
        deps: {
          tabChannel: 'interTabChannel',
          iframeChannel: 'iframeChannel',
          webChannel: 'notificationWebChannel'
        }
      },
      notificationWebChannel: {
        constructor: function (options) {
          return new WebChannel(Constants.ACCOUNT_UPDATES_WEBCHANNEL_ID);
        },
        initialize: 'initialize'
      },
      oAuthClient: {
        constructor: function (options) {
          var client = new OAuthClient({
            oAuthUrl: options.config.oAuthUrl
          });

          self._oAuthClient = client;
          return client;
        },
        deps: {
          config: 'config'
        }
      },
      oAuthRelier: {
        constructor: OAuthRelier,
        deps: {
          oAuthClient: 'oAuthClient',
          session: 'session',
          window: 'window'
        }
      },
      originCheck: {
        constructor: function (options) {
          return new OriginCheck(options.window);
        },
        deps: {
          window: 'window'
        }
      },
      profileClient: {
        constructor: function (options) {
          return new ProfileClient({
            profileUrl: options.config.profileUrl
          });
        },
        deps: {
          config: 'config'
        }
      },
      redirectAuthenticationBroker: {
        constructor: RedirectAuthenticationBroker,
        deps: {
          window: 'window',
          relier: 'relier',
          assertionLibrary: 'assertionLibrary',
          oAuthClient: 'oAuthClient',
          session: 'session',
          metrics: 'metrics'
        }
      },
      relier: {
        instance: options.relier,
        constructor: function () {
          return self.initializeRelier();
        },
        initialize: 'fetch'
      },
      marketingEmailClient: {
        constructor: function (options) {
          var config = options.config;
          return new MarketingEmailClient({
            baseUrl: config.marketingEmailServerUrl,
            preferencesUrl: config.marketingEmailPreferencesUrl
          });
        },
        deps: {
          config: 'config'
        }
      },
      storage: {
        constructor: function (options) {
          return Storage.factory('localStorage', options.window);
        },
        deps: {
          window: 'window'
        }
      },
      router: {
        instance: options.router,
        constructor: function (options) {
          options.language = options.config.language;

          var router = options.window.router = new Router(options);

          return router;
        },
        deps: {
          metrics: 'metrics',
          config: 'config',
          relier: 'relier',
          broker: 'authenticationBroker',
          fxaClient: 'fxaClient',
          user: 'user',
          interTabChannel: 'interTabChannel',
          session: 'session',
          formPrefill: 'formPrefill',
          notifications: 'notifications',
          able: 'able',
          window: 'window',
          translator: 'translator'
        }
      },
      sentryMetrics: {
        constructor: function (options) {
          return new SentryMetrics(options.window.location.host);
        },
        deps: {
          window: 'window'
        }
      },
      session: {
        instance: Session
      },
      translator: {
        constructor: Translator,
        initialize: 'fetch'
      },
      uniqueUserId: {
        constructor: function (options) {
          /**
           * Sets a UUID value that is unrelated to any account information.
           * This value is useful to determine if the logged out user qualifies
           * for A/B testing or metrics.
           */
          return new UniqueUserId(options).get('uniqueUserId');
        },
        deps: {
          window: 'window'
        }
      },
      user: {
        instance: options.user,
        constructor: function (options) {
          options.oAuthClientId = options.config.oAuthClientId;

          return new User(options);
        },
        deps: {
          config: 'config',
          profileClient: 'profileClient',
          oAuthClient: 'oAuthClient',
          fxaClient: 'fxaClient',
          marketingEmailClient: 'marketingEmailClient',
          assertion: 'assertionLibrary',
          storage: 'storage',
          uniqueUserId: 'uniqueUserId'
        }
      },
      webChannelAuthenticationBroker: {
        constructor: WebChannelAuthenticationBroker,
        deps: {
          window: 'window',
          relier: 'relier',
          fxaClient: 'fxaClient',
          assertionLibrary: 'assertionLibrary',
          oAuthClient: 'oAuthClient',
          session: 'session'
        }
      },
      window: {
        instance: options.window || window,
      }
    };
  }

  Start.prototype = {
    // delay before redirecting to the error page to
    // ensure metrics are reported to the backend.
    ERROR_REDIRECT_TIMEOUT_MS: 1000,
    startApp: function () {
      var self = this;

      // The items in the below `create` are not depended upon by
      // anything and must be created manually
      return this.create('errorMetrics', 'heightObserver', 'closeButton')
        .then(this.upgradeStorageFormats.bind(this))
        .then(_.bind(this.allResourcesReady, this))
        .fail(function (err) {
          if (console && console.error) {
            console.error('Critical error:');
            console.error(String(err));
          }

          // if there is no error metrics set that means there was probably an error with app start
          // therefore force error reporting to get error information
          if (! self._sentryMetrics) {
            // TODO ensure this doesn't blow up. should probably use a then after
            // this.
            self.create('sentryMetrics');
          }

          Raven.captureException(err);

          if (self._metrics) {
            self._metrics.logError(err);
          }

          // give a bit of time to flush the Sentry error logs,
          // otherwise Safari Mobile redirects too quickly.
          return p().delay(self.ERROR_REDIRECT_TIMEOUT_MS)
            .then(function () {
              if (self._metrics) {
                return self._metrics.flush();
              }
            })
            .then(function () {
              //Something terrible happened. Let's bail.
              /*var redirectTo = self._getErrorPage(err);*/
              console.error(String(err));
              console.dir(err);
              /*self._window.location.href = redirectTo;*/
            });
        });
    },

    initializeErrorMetrics: function (options) {
      var able = options.able;
      var config = options.config;
      var uniqueUserId = options.uniqueUserId;
      if (config.env) {
        var abData = {
          env: config.env,
          uniqueUserId: uniqueUserId
        };
        var abChoose = able.choose('sentryEnabled', abData);

        if (abChoose) {
          return this.create('sentryMetrics');
        }
      }
    },

    create: function () {
      var diy = new DIY(this._depList);
      var names = [].slice.call(arguments, 0).filter(function (name) {
        return typeof name === 'string' && name.length;
      });

      if (names.length === 1) {
        return diy.create(names[0]);
      } else {
        var promises = names.map(function (name) {
          return diy.create(name);
        });
        return p.all(promises);
      }
    },

    _getAllowedParentOrigins: function () {
      var self = this;
      return self.create('config', 'relier')
        .spread(function (config, relier) {
          if (! self._isInAnIframe()) {
            return [];
          } else if (self._isFxDesktop()) {
            // If in an iframe for sync, the origin is checked against
            // a pre-defined set of origins sent from the server.
            return config.allowedParentOrigins;
          } else if (self._isOAuth()) {
            // If in oauth, the relier has the allowed parent origin.
            return [relier.get('origin')];
          }

          return [];
        });
    },

    _checkParentOrigin: function (originCheck) {
      var self = this;
      return p.all([
        self.create('window'),
        self.create('originCheck'),
        self._getAllowedParentOrigins()
      ]).spread(function (win, originCheck, allowedOrigins) {
        return originCheck.getOrigin(win.parent, allowedOrigins);
      });
    },

    initializeIframeChannel: function (options) {
      var self = this;

      if (! self._isInAnIframe()) {
        // Create a NullChannel in case any dependencies require it, such
        // as when the FirstRunAuthenticationBroker is used in functional
        // tests. The firstrun tests don't actually use an iframe, so the
        // real IframeChannel is not created.
        return new NullChannel();
      }

      var win = options.window;
      var metrics = options.metrics;
      return self._checkParentOrigin()
        .then(function (parentOrigin) {
          if (! parentOrigin) {
            // No allowed origins were found. Illegal iframe.
            throw AuthErrors.toError('ILLEGAL_IFRAME_PARENT');
          }

          var iframeChannel = new IframeChannel();
          iframeChannel.initialize({
            window: win,
            origin: parentOrigin,
            metrics: metrics
          });

          return iframeChannel;
        });
    },

    initializeRelier: function () {
      var relierName;
      if (this._isFxDesktop()) {
        // Use the FxDesktopRelier for sync verification so that
        // the service name is translated correctly.
        relierName = 'fxDesktopRelier';
      } else if (this._isOAuth()) {
        relierName = 'oAuthRelier';
      } else {
        relierName = 'baseRelier';
      }

      return this.create(relierName);
    },

    initializeAuthenticationBroker: function () {
      var authenticationBrokerName;
      if (this._isFirstRun()) {
        authenticationBrokerName = 'firstRunAuthenticationBroker';
      } else if (this._isFxDesktopV2()) {
        authenticationBrokerName = 'fxDesktopV2AuthenticationBroker';
      } else if (this._isFxDesktopV1()) {
        authenticationBrokerName = 'fxDesktopV1AuthenticationBroker';
      } else if (this._isWebChannel()) {
        authenticationBrokerName = 'webChannelAuthenticationBroker';
      } else if (this._isIframe()) {
        authenticationBrokerName = 'iframeAuthenticationBroker';
      } else if (this._isOAuth()) {
        authenticationBrokerName = 'redirectAuthenticationBroker';
      } else {
        authenticationBrokerName = 'baseAuthenticationBroker';
      }

      return this.create(authenticationBrokerName, 'metrics', 'window')
        .spread(function (authenticationBroker, metrics, win) {
          authenticationBroker.on('error', function (err) {
            win.console.error('broker error', String(err));
            metrics.logError(err);
          });

          metrics.setBrokerType(authenticationBroker.type);

          return authenticationBroker;
        });
    },

    upgradeStorageFormats: function () {
      return this.create('user', 'fxaClient', 'session')
        .spread(function (user, fxaClient, session) {
          return user.upgradeFromSession(session, fxaClient);
        });
    },

    initializeRouter: function () {
      return this.create('router');
    },

    allResourcesReady: function () {
      var self = this;
      return this.create('window', 'history', 'router')
        .spread(function (win, history, router) {
          // The IFrame cannot use pushState or else a page transition
          // would cause the parent frame to redirect.
          var usePushState = ! self._isInAnIframe();

          if (! usePushState) {
            // If pushState cannot be used, Backbone falls back to using
            // the hashchange. Put the initial pathname onto the hash
            // so the correct page loads.
            window.location.hash = win.location.pathname;
          }

          // If a new start page is specified, do not attempt to render
          // the route displayed in the URL because the user is
          // immediately redirected
          return self._selectStartPage()
            .then(function (startPage) {
              var isSilent = !! startPage;
              history.start({ pushState: usePushState, silent: isSilent });
              if (startPage) {
                router.navigate(startPage);
              }
            });
        });
    },

    _getErrorPage: function (err) {
      if (OAuthErrors.is(err, 'MISSING_PARAMETER') ||
          OAuthErrors.is(err, 'UNKNOWN_CLIENT')) {
        var queryString = Url.objToSearchString({
          message: OAuthErrors.toInterpolatedMessage(err, this._translator),
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

    _isSync: function () {
      return this._searchParam('service') === Constants.SYNC_SERVICE;
    },

    _isFxDesktopV1: function () {
      // Firefox for iOS is using the desktop broker for now.
      // It provides a custom context value so that we can implement
      // a custom auth broker if necessary in the future.
      return (this._searchParam('context') === Constants.FX_DESKTOP_V1_CONTEXT ||
              this._searchParam('context') === Constants.FX_IOS_V1_CONTEXT);
    },

    _isFxDesktopV2: function () {
      // A user is signing into sync from within an iframe on a trusted
      // web page. Automatically speak version 2 using WebChannels.
      //
      // A check for context=fx_desktop_v2 can be added when about:accounts
      // is converted to use WebChannels.
      return (this._isSync() && this._isIframeContext()) ||
             (this._searchParam('context') === Constants.FX_DESKTOP_V2_CONTEXT);
    },

    _isFxDesktop: function () {
      // In addition to the two obvious fx desktop choices, sync is always
      // considered fx-desktop. If service=sync is on the URL, it's considered
      // fx-desktop.
      return this._isFxDesktopV1() || this._isFxDesktopV2() || this._isSync();
    },

    _isFirstRun: function () {
      return this._isFxDesktopV2() && this._isIframeContext();
    },

    _isWebChannel: function () {
      return !! (this._searchParam('webChannelId') || // signup/signin
                (this._isOAuthVerificationSameBrowser() &&
                  Session.oauth && Session.oauth.webChannelId));
    },

    _isInAnIframe: function () {
      return new Environment(this._window).isFramed();
    },

    _isIframeContext: function () {
      return this._searchParam('context') === Constants.IFRAME_CONTEXT;
    },

    _isIframe: function () {
      return this._isInAnIframe() && this._isIframeContext();
    },

    _isOAuth: function () {
      // for /force_auth
      return !! (this._searchParam('client_id') ||
                 // for verification flows
                 (this._searchParam('code') && this._searchParam('service')) ||
                 // for /oauth/signin or /oauth/signup
                 /oauth/.test(this._window.location.href));
    },

    _isOAuthVerificationSameBrowser: function () {
      var savedClientId = Session.oauth && Session.oauth.client_id;
      return !! (this._searchParam('code') &&
                (this._searchParam('service') === savedClientId));
    },

    _searchParam: function (name) {
      return Url.searchParam(name, this._window.location.search);
    },

    _selectStartPage: function () {
      return this.create('window')
        .then(function (win) {
          if (win.location.pathname !== '/cookies_disabled' &&
            ! Storage.isLocalStorageEnabled(win)) {
            return 'cookies_disabled';
          }
        });
    },

    _isAutomatedBrowser: function () {
      return this._searchParam('automatedBrowser') === 'true';
    }
  };

  return Start;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * A metrics module!
 *
 * An instantiated metrics object has two primary APIs:
 *
 * metrics.logEvent(<event_name>);
 * metrics.startTimer(<timer_name>)/metrics.stopTimer(<timer_name);
 *
 * Metrics are automatically sent to the server on window.unload
 * but can also be sent by calling metrics.flush();
 */

define([
  'underscore',
  'backbone',
  'jquery',
  'speedTrap',
  'lib/xhr',
  'lib/strings',
  'lib/environment',
  'lib/promise'
], function (_, Backbone, $, speedTrap, xhr, Strings, Environment, p) {
  'use strict';

  // Speed trap is a singleton, convert it
  // to an instantiable function.
  let SpeedTrap = function () {};
  SpeedTrap.prototype = speedTrap;

  const ALLOWED_FIELDS = [
    'campaign',
    'context',
    'duration',
    'entrypoint',
    'events',
    'migration',
    'lang',
    'marketing',
    'navigationTiming',
    'referrer',
    'screen',
    'service',
    'timers',
    'broker',
    'ab',
    'isSampledUser',
    'startTime',
    'flushTime',
    'uniqueUserId',
    'utm_campaign',
    'utm_content',
    'utm_medium',
    'utm_source',
    'utm_term'
  ];

  const DEFAULT_INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;
  const NOT_REPORTED_VALUE = 'none';
  const UNKNOWN_CAMPAIGN_ID = 'unknown';


  // convert a hash of marketing impressions into an array of objects.
  function flattenMarketingImpressions (impressions) {
    return _.reduce(impressions, function (memo, impressionsById) {
      return memo.concat(_.map(impressionsById, function (impression) {
        return impression;
      }));
    }, []);
  }

  function Metrics (options = {}) {
    // by default, send the metrics to the content server.
    this._collector = options.collector || '';

    this._xhr = options.xhr || xhr;

    this._speedTrap = new SpeedTrap();
    this._speedTrap.init();

    // `timers` and `events` are part of the public API
    this.timers = this._speedTrap.timers;
    this.events = this._speedTrap.events;

    this._window = options.window || window;

    this._lang = options.lang || 'unknown';
    this._context = options.context || 'web';
    this._entrypoint = options.entrypoint || NOT_REPORTED_VALUE;
    this._migration = options.migration || NOT_REPORTED_VALUE;
    this._service = options.service || NOT_REPORTED_VALUE;
    this._campaign = options.campaign || NOT_REPORTED_VALUE;
    this._brokerType = options.brokerType || NOT_REPORTED_VALUE;

    this._clientHeight = options.clientHeight || NOT_REPORTED_VALUE;
    this._clientWidth = options.clientWidth || NOT_REPORTED_VALUE;
    this._devicePixelRatio = options.devicePixelRatio || NOT_REPORTED_VALUE;
    this._screenHeight = options.screenHeight || NOT_REPORTED_VALUE;
    this._screenWidth = options.screenWidth || NOT_REPORTED_VALUE;

    // All user metrics are sent to the backend. Data is only
    // reported to Heka and Datadog if `isSampledUser===true`.
    this._isSampledUser = options.isSampledUser || false;

    this._referrer = this._window.document.referrer || NOT_REPORTED_VALUE;
    this._uniqueUserId = options.uniqueUserId || NOT_REPORTED_VALUE;
    this._utmCampaign = options.utmCampaign || NOT_REPORTED_VALUE;
    this._utmContent = options.utmContent || NOT_REPORTED_VALUE;
    this._utmMedium = options.utmMedium || NOT_REPORTED_VALUE;
    this._utmSource = options.utmSource || NOT_REPORTED_VALUE;
    this._utmTerm = options.utmTerm || NOT_REPORTED_VALUE;

    this._inactivityFlushMs = options.inactivityFlushMs || DEFAULT_INACTIVITY_TIMEOUT_MS;

    this._marketingImpressions = {};

    this._able = options.able;
    this._env = options.environment || new Environment(this._window);

    this._lastAbLength = 0;
    // if navigationTiming is supported,
    // the baseTime will be from navitgationTiming.navigationStart, otherwise Date.now().
    this._startTime = options.startTime || this._speedTrap.baseTime;
  }

  _.extend(Metrics.prototype, Backbone.Events, {
    ALLOWED_FIELDS,

    init () {
      this._flush = _.bind(this.flush, this, true);
      $(this._window).on('unload', this._flush);
      // iOS will not send events once the window is in the background,
      // meaning the `unload` handler is ineffective. Send events on blur
      // instead, so events are not lost when a user goes to verify their
      // email.
      $(this._window).on('blur', this._flush);

      // Set the initial inactivity timeout to clear navigation timing data.
      this._resetInactivityFlushTimeout();
    },

    destroy () {
      $(this._window).off('unload', this._flush);
      $(this._window).off('blur', this._flush);
      this._clearInactivityFlushTimeout();
    },

    /**
     * Send the collected data to the backend.
     */
    flush (isPageUnloading) {
      // Inactivity timer is restarted when the next event/timer comes in.
      // This avoids sending empty result sets if the tab is
      // just sitting there open with no activity.
      this._clearInactivityFlushTimeout();

      let filteredData = this.getFilteredData();

      if (! this._isFlushRequired(filteredData)) {
        return p();
      }

      this._lastAbLength = filteredData.ab.length;

      return this._send(filteredData, isPageUnloading)
        .then((sent) => {
          if (sent) {
            this._speedTrap.events.clear();
            this._speedTrap.timers.clear();
          }

          return sent;
        });
    },

    _isFlushRequired (data) {
      return data.events.length !== 0 ||
        Object.keys(data.timers).length !== 0 ||
        data.ab.length !== this._lastAbLength;
    },

    _clearInactivityFlushTimeout () {
      clearTimeout(this._inactivityFlushTimeout);
    },

    _resetInactivityFlushTimeout () {
      this._clearInactivityFlushTimeout();

      this._inactivityFlushTimeout =
          setTimeout(() => {
            this.logEvent('inactivity.flush');
            this.flush();
          }, this._inactivityFlushMs);
    },


    /**
     * Get all the data, whether it's allowed to be sent or not.
     */
    getAllData () {
      let loadData = this._speedTrap.getLoad();
      let unloadData = this._speedTrap.getUnload();

      let allData = _.extend({}, loadData, unloadData, {
        ab: this._able ? this._able.report() : [],
        context: this._context,
        service: this._service,
        broker: this._brokerType,
        lang: this._lang,
        entrypoint: this._entrypoint,
        migration: this._migration,
        marketing: flattenMarketingImpressions(this._marketingImpressions),
        campaign: this._campaign,
        referrer: this._referrer,
        screen: {
          devicePixelRatio: this._devicePixelRatio,
          clientWidth: this._clientWidth,
          clientHeight: this._clientHeight,
          width: this._screenWidth,
          height: this._screenHeight
        },
        isSampledUser: this._isSampledUser,
        startTime: this._startTime,
        flushTime: Date.now(),
        uniqueUserId: this._uniqueUserId,
        utm_campaign: this._utmCampaign, //eslint-disable-line camelcase
        utm_content: this._utmContent, //eslint-disable-line camelcase
        utm_medium: this._utmMedium, //eslint-disable-line camelcase
        utm_source: this._utmSource, //eslint-disable-line camelcase
        utm_term: this._utmTerm, //eslint-disable-line camelcase
      });

      return allData;
    },

    /**
     * Get the filtered data.
     * Filtered data is data that is allowed to be sent,
     * that is defined and not an empty string.
     */
    getFilteredData () {
      let allData = this.getAllData();

      let filteredData = {};
      _.forEach(ALLOWED_FIELDS, function (itemName) {
        if (typeof allData[itemName] !== 'undefined' &&
            allData[itemName] !== '') {
          filteredData[itemName] = allData[itemName];
        }
      });

      return filteredData;
    },

    _send (data, isPageUnloading) {
      let url = this._collector + '/metrics';
      let payload = JSON.stringify(data);

      if (this._env.hasSendBeacon()) {
        // Always use sendBeacon if it is available because:
        //   1. it works asynchronously, even on unload.
        //   2. user agents SHOULD make "multiple attempts to transmit the
        //      data in presence of transient network or server errors".
        return p().then(() => {
          return this._window.navigator.sendBeacon(url, payload);
        });
      }

      // XHR is a fallback option because synchronous XHR has been deprecated,
      // but we must call it synchronously in the unload case.
      return this._xhr.ajax({
        async: ! isPageUnloading,
        type: 'POST',
        url,
        contentType: 'application/json',
        data: payload
      })
      // Boolean return values imitate the behaviour of sendBeacon
      .then(function () {
        return true;
      }, function () {
        return false;
      });
    },

    /**
     * Log an event
     */
    logEvent (eventName) {
      this._resetInactivityFlushTimeout();
      this.events.capture(eventName);
    },

    /**
     * Start a timer
     */
    startTimer (timerName) {
      this._resetInactivityFlushTimeout();
      this.timers.start(timerName);
    },

    /**
     * Stop a timer
     */
    stopTimer (timerName) {
      this._resetInactivityFlushTimeout();
      this.timers.stop(timerName);
    },

    /**
     * Log an error.
     */
    logError (error) {
      this.logEvent(this.errorToId(error));
    },

    /**
     * Convert an error to an identifier that can be used for logging.
     */
    errorToId (error) {
      let id = Strings.interpolate('error.%s.%s.%s', [
        error.context || 'unknown context',
        error.namespace || 'unknown namespace',
        error.errno || String(error)
      ]);
      return id;
    },

    /**
     * Log a screen
     */
    logScreen (screenName) {
      this.logEvent(this.screenToId(screenName));
    },

    /**
     * Convert a screenName an identifier
     */
    screenToId (screenName) {
      return 'screen.' + screenName;
    },

    /**
     * Log when a marketing snippet is shown to the user
     *
     * @param {String} campaignId - marketing campaign id
     * @param {String} url - url of marketing link
     */
    logMarketingImpression (campaignId, url) {
      campaignId = campaignId || UNKNOWN_CAMPAIGN_ID;

      let impressions = this._marketingImpressions;
      if (! impressions[campaignId]) {
        impressions[campaignId] = {};
      }

      impressions[campaignId][url] = {
        campaignId,
        url,
        clicked: false
      };
    },

    /**
     * Log whether the user clicked on a marketing link
     *
     * @param {String} campaignId - marketing campaign id
     * @param {String} url - URL clicked.
     */
    logMarketingClick (campaignId, url) {
      campaignId = campaignId || UNKNOWN_CAMPAIGN_ID;

      let impression = this.getMarketingImpression(campaignId, url);

      if (impression) {
        impression.clicked = true;
      }
    },

    getMarketingImpression (campaignId, url) {
      let impressions = this._marketingImpressions;
      return impressions[campaignId] && impressions[campaignId][url];
    },

    setBrokerType (brokerType) {
      this._brokerType = brokerType;
    },

    isCollectionEnabled () {
      return this._isSampledUser;
    }
  });

  return Metrics;
});



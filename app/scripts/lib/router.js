/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const Backbone = require('backbone');
  const Cocktail = require('cocktail');
  const NotifierMixin = require('lib/channels/notifier-mixin');
  const { ROUTES } = require('lib/routes');
  const Storage = require('./storage');

  const proto = Backbone.Router.prototype;
  const Router = Backbone.Router.extend({
    routes: {
      // Routes are added for each `ROUTES` entry in `initialize`
    },

    initialize (options = {}) {
      this.metrics = options.metrics;
      this.window = options.window || window;

      this.storage = Storage.factory('sessionStorage', this.window);

      Object.keys(ROUTES).forEach((route) => {
        this.route(`${route}(/)`, 'notifyOfRouteChange');
      });
    },

    notifications: {
      'navigate': 'onNavigate',
      'navigate-back': 'onNavigateBack',
      'once!view-shown': 'onFirstViewRendered'
    },

    onNavigate (event) {
      if (event.server) {
        return this.navigateAway(event.url);
      }

      this._nextViewData = event.nextViewData;
      this.navigate(event.url, event.routerOptions);
    },

    onNavigateBack (event) {
      this._nextViewData = event.nextViewData;
      this.navigateBack();
    },

    onFirstViewRendered () {
      // back is enabled after the first view is rendered or
      // if the user re-starts the app.
      this.storage.set('canGoBack', true);
    },

    /**
     * Navigate to an internal URL.
     *
     * @param {String} url - target url
     * @param {Object} [options]
     *   @param {Boolean} [options.clearQueryParams] - if true, clear query
     *     parameters before showing the next view. Defaults to `false`.
     */
    navigate (url, options = {}) {
      if (! options.hasOwnProperty('trigger')) {
        options.trigger = true;
      }

      // If the caller has not asked us to clear the query params
      // and the new URL does not contain query params, propagate
      // the current query params to the next view.
      if (! options.clearQueryParams && ! /\?/.test(url)) {
        url = url + this.window.location.search;
      }

      proto.navigate.call(this, url, options);
    },

    /**
     * Navigate externally to the application, flushing the metrics
     * before doing so.
     *
     * @param {String} url
     * @returns {Promise}
     */
    navigateAway (url) {
      return this.metrics.flush()
        .then(() => {
          this.window.location.href = url;
        });
    },

    /**
     * Navigate back one URL
     */
    navigateBack () {
      this.window.history.back();
    },

    /**
     * Check if the user can go back.
     *
     * @returns {Boolean}
     */
    canGoBack () {
      return !! this.storage.get('canGoBack');
    },

    /**
     * Get the pathname of the current page.
     *
     * @returns {String}
     */
    getCurrentPage () {
      const fragment = Backbone.history.fragment || '';
      return fragment
              // we only want the pathname
              .replace(/\?.*/, '')
              // strip leading /
              .replace(/^\//, '')
              // strip trailing /
              .replace(/\/$/, '');
    },

    /**
     * Get the current view name
     *
     * @returns {String}
     */
    getCurrentViewName () {
      return this.getCurrentPage()
              // any remaining slashes get converted to '.'
              .replace(/\//g, '.')
              // replace _ with -
              .replace(/_/g, '-');
    },

    /**
     * Notify the system a new View should be shown.
     */
    notifyOfRouteChange () {
      this.notifier.trigger('change:route', this.getRouteOptions());
    },

    /**
     * Get the options to pass to a View constructor.
     *
     * @returns {Object}
     */
    getRouteOptions () {
      return {
        canGoBack: this.canGoBack(),
        currentPage: this.getCurrentPage(),
        model: new Backbone.Model(this._nextViewData),
        viewName: this.getCurrentViewName()
      };
    }
  });

  Cocktail.mixin(
    Router,
    NotifierMixin
  );

  module.exports = Router;
});

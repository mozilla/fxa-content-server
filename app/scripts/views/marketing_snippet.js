/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Handles the marketing snippet on the 'ready' page.
 *
 * Shows `Get Sync on Firefox for Android` for users that complete signup for sync in Firefox Desktop.
 * Newsletter optin
 */

'use strict';

define([
  'views/base',
  'views/snippets/newsletter_optin',
  'views/snippets/sync_android'
], function (BaseView, NewsletterOptinSnippet, SyncAndroidSnippet) {
  var NEWSLETTER_OPTIN_PERCENTAGE = 50;

  var View = BaseView.extend({
    initialize: function (options) {
      options = options || {};

      this._type = options.type;
      this._service = options.service;
      this._language = options.language;
      this._newsletterOptinPercentage = 'newsletterOptinPercentage' in options ? options.newsletterOptinPercentage : NEWSLETTER_OPTIN_PERCENTAGE;
    },

    context: function () {
      var shouldShowMarketing = this._shouldShowSignUpMarketing();

      return {
        showSignUpMarketing: shouldShowMarketing
      };
    },

    events: {
      'click .marketing-link': '_logMarketingClick'
    },

    afterRender: function () {
      var Snippet = this._chooseSnippet();

      if (Snippet) {
        var snippet = new Snippet({
          el: this.el,
          metrics: this.metrics,
          window: this.window,
          fxaClient: this.fxaClient
        });

        this.trackSubview(snippet);
        return snippet.render();
      }
    },

    _chooseSnippet: function () {
      var Snippet;

      if (this._shouldShowNewsletterOptin()) {
        Snippet = NewsletterOptinSnippet;
      } else if (this._shouldShowSignUpMarketing()) {
        Snippet = SyncAndroidSnippet;
      }

      return Snippet;
    },

    _shouldShowNewsletterOptin: function () {
      // If the user cannot see the signup marketing, they should always
      // see the newsletter optin. If the user can see the signup
      // marketing, decide between newsletter and the signup marketing.
      return this.is('sign_up') && (
              ! this._shouldShowSignUpMarketing() ||
                this._isSelectedForNewsletterOptin());
    },

    _isSelectedForNewsletterOptin: function () {
      return Math.random() <= (this._newsletterOptinPercentage / 100);
    },

    _shouldShowSignUpMarketing: function () {
      var isSignUp = this.is('sign_up');
      var isSync = this._service === 'sync';
      var isFirefoxMobile = this._isFirefoxMobile();

      return isSignUp && isSync && ! isFirefoxMobile;
    },

    _isFirefoxMobile: function () {
      // For UA information, see
      // https://developer.mozilla.org/docs/Gecko_user_agent_string_reference

      var ua = this.window.navigator.userAgent;

      // covers both B2G and Firefox for Android
      var isMobileFirefox = /Mobile/.test(ua) && /Firefox/.test(ua);
      var isTabletFirefox = /Tablet/.test(ua) && /Firefox/.test(ua);

      return isMobileFirefox || isTabletFirefox;
    },

    is: function (type) {
      return this._type === type;
    }
  });

  return View;
});



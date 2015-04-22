/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Handles the marketing snippet on the 'ready' page.
 *
 * Shows `Get Sync on Firefox for Android` for users that complete
 * signup for sync in Firefox Desktop.
 */

'use strict';

define([
  'views/base',
  'lib/constants',
  'stache!templates/marketing_snippet'
], function (BaseView, Constants, Template) {

  var View = BaseView.extend({
    template: Template,
    appStoreImageLanguages: [
      'da',
      'de',
      'en',
      'es',
      'et',
      'fr',
      'he',
      'hu',
      'id',
      'it',
      'ja',
      'ko',
      'lt',
      'nb-NO',
      'nl',
      'pl',
      'pt-BR',
      'pt',
      'ru',
      'sk',
      'sl',
      'sv-SE',
      'tr',
      'zh-CN',
      'zh-TW'
    ],
    playStoreImageLanguages: [
      'ca',
      'cs',
      'da',
      'de',
      'en',
      'es',
      'et',
      'fr',
      'hu',
      'id',
      'it',
      'ja',
      'ko',
      'lt',
      'nb-NO',
      'nl',
      'pl',
      'pt-BR',
      'pt',
      'ru',
      'sk',
      'sl',
      'sv',
      'tr',
      'uk',
      'zh-CN',
      'zh-TW'
    ],

    initialize: function (options) {
      options = options || {};

      this._type = options.type;
      this._service = options.service;
    },

    context: function () {
      var shouldShowMarketing = this._shouldShowSignUpMarketing();
      var iosUser = this._isIosUser();
      var androidUser = this._isAndroidUser();
      // app store link will not be ready before push, so this will
      // need to come from settings or something?
      var appStoreLink = 'http://giphy.com/gifs/the-simpsons-internet-fJKG1UTK7k64w';
      var appStoreImage = this._appStoreImage();
      var playStoreImage = this._playStoreImage();

      return {
        showSignUpMarketing: shouldShowMarketing,
        isiOS: iosUser,
        isAndroid: androidUser,
        isOther: (!iosUser && !androidUser),
        appStoreLink: appStoreLink,
        appStoreImage: appStoreImage,
        playStoreImage: playStoreImage
      };
    },

    events: {
      'click .marketing-link': '_logMarketingClick'
    },

    afterRender: function () {
      var marketingType = this.$('[data-marketing-type]').attr('data-marketing-type');
      var marketingLink = this.$('.marketing-link').attr('href');

      this.metrics.logMarketingImpression(marketingType, marketingLink);
    },

    _shouldShowSignUpMarketing: function () {
      var isSignUp = this._type === 'sign_up';
      var isSync = this._service === Constants.FX_DESKTOP_SYNC;
      var isFirefoxMobile = this._isFirefoxMobile();

      // user can only be randomly selected for survey if
      // they speak english. If the user is completing a signup for sync and
      // does not speak english, ALWAYS show the marketing snippet.
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

    _isIosUser: function() {
      var plat = this.window.navigator.platform;

      if (plat.indexOf('iPhone') !== -1 || plat.indexOf('iPad') !== -1 || plat.indexOf('iPod') !== -1 ) {
        return true;
      } else {
        return false;
      }
    },

    _isAndroidUser: function() {
      return /android/i.test(this.window.navigator.userAgent);
    },

    _logMarketingClick: function () {
      this.metrics.logMarketingClick();
    },

    _appStoreImage: function() {
      // fall back to en image if user's language is not supported
      var buttonLang = (this.appStoreImageLanguages.indexOf(this._language) > -1) ? this._language : 'en';

      return '/images/apple_app_store_button/' + buttonLang + '.svg';
    },

    _playStoreImage: function() {
      var buttonPath = (this.playStoreImageLanguages.indexOf(this._language) > -1) ? this._language : 'en';

      if (this._isHighRes()) {
        buttonPath += '@2x';
      }

      return '/images/google_play_store_button/' + buttonPath + '.png';
    },

    _isHighRes: function() {
      if (this.window.matchMedia) {
        if (this.window.matchMedia('(-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 1.5dppx), (min-resolution: 144dpi)')) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  });

  return View;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/constants',
  'lib/environment',
  'lib/origin-check',
  'lib/session',
  'lib/url',
  'component!lib/components/config',
  'component!lib/components/window',
], function (Constants, Environment, OriginCheck, Session, Url, config, window) {
  'use strict';

  return {
    isIframe: function () {
      return this.isInAnIframe() && this.isIframeContext();
    },

    isInAnIframe: function () {
      return new Environment(window).isFramed();
    },

    isIframeContext: function () {
      return this.searchParam('context') === Constants.IFRAME_CONTEXT;
    },

    isSync: function () {
      return this.searchParam('service') === Constants.FX_DESKTOP_SYNC;
    },

    isFirstRun: function () {
      return this.isFxDesktopV2() && this.isIframeContext();
    },

    isFxDesktopV1: function () {
      return this.searchParam('context') === Constants.FX_DESKTOP_CONTEXT;
    },

    isFxDesktopV2: function () {
      // A user is signing into sync from within an iframe on a trusted
      // web page. Automatically speak version 2 using WebChannels.
      //
      // A check for context=fx_desktop_v2 can be added when about:accounts
      // is converted to use WebChannels.
      return (this.isSync() && this.isIframeContext()) ||
             (this.searchParam('context') === Constants.FX_DESKTOP_V2_CONTEXT);
    },

    isWebChannel: function () {
      return !! (this.searchParam('webChannelId') || // signup/signin
                (this.isOAuthVerificationSameBrowser() &&
                  Session.oauth && Session.oauth.webChannelId));
    },

    isFxDesktop: function () {
      // In addition to the two obvious fx desktop choices, sync is always
      // considered fx-desktop. If service=sync is on the URL, it's considered
      // fx-desktop.
      return this.isFxDesktopV1() || this.isFxDesktopV2() || this.isSync();
    },

    isOAuth: function () {
      // for /force_auth
      return !! (this.searchParam('client_id') ||
                 // for verification flows
                 (this.searchParam('code') && this.searchParam('service')) ||
                 // for /oauth/signin or /oauth/signup
                 /oauth/.test(window.location.href));
    },

    isAutomatedBrowser: function () {
      return this.searchParam('automatedBrowser') === 'true';
    },

    isOAuthVerificationSameBrowser: function () {
      var savedClientId = Session.oauth && Session.oauth.client_id;
      return !! (this.searchParam('code') &&
                (this.searchParam('service') === savedClientId));
    },

    searchParam: function (name) {
      return Url.searchParam(name, window.location.search);
    },

    getAllowedParentOrigins: function (relier) {
      if (! this.isInAnIframe()) {
        return [];
      } else if (this.isFxDesktop()) {
        // If in an iframe for sync, the origin is checked against
        // a pre-defined set of origins sent from the server.
        return config.allowedParentOrigins;
      } else if (this.isOAuth()) {
        // If in oauth, the relier has the allowed parent origin.
        return [relier.get('origin')];
      }

      return [];
    },

    checkParentOrigin: function (originCheck, relier) {
      var self = this;
      originCheck = originCheck || new OriginCheck(window);
      var allowedOrigins = self.getAllowedParentOrigins();

      return originCheck.getOrigin(window.parent, allowedOrigins);
    },
  };

});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * If the user verifies their email in an instance of Firefox
 * that other than the one they used to sign up, suggest
 * that they sign in. If the user verifies in a non-Firefox
 * browser, they are nudged to install Firefox for Android or iOS.
 */
define(function (require, exports, module) {
  'use strict';

  const Cocktail = require('cocktail');
  const Constants = require('lib/constants');
  const ExperimentMixin = require('views/mixins/experiment-mixin');
  const FormView = require('views/form');
  const MarketingMixin = require('views/mixins/marketing-mixin');
  const MarketingSnippet = require('views/marketing_snippet');
  const Template = require('stache!templates/connect_another_device');
  const Url = require('lib/url');
  const UserAgent = require('lib/user-agent');

  const View = FormView.extend({
    template: Template,

    initialize (options = {}) {
      this._createView = options.createView;
    },

    events: {
      'click #signin': '_onSignInClick'
    },

    showChildView (ChildView, options) {
      // an extra element is needed to attach the child view to, the extra element
      // is removed from the DOM when the view is destroyed. Without it, .child-view
      // is removed from the DOM and a 2nd child view cannot be displayed.
      this.$('.child-view').append('<div>');
      options.el = this.$('.child-view > div');
      const childView = this._createView(ChildView, options);
      return childView.render()
        .then(() => this.trackChildView(childView));
    },

    beforeRender () {
      return this.getAccount().isSignedIn()
        .then((isSignedIn) => {
          this.model.set('isSignedIn', isSignedIn);
          this.notifier.trigger(`connectAnotherDevice.signedin.${isSignedIn}`);
        });
    },

    afterRender () {
      const options = {
        marketingId: Constants.MARKETING_ID_AUTUMN_2016
      };

      // If the user signed up and verified in Firefox for Android,
      // show marketing material for both mobile OSs.
      if (this.model.get('isSignedIn') && this._getUap().isFirefoxAndroid()) {
        options.which = MarketingSnippet.WHICH.BOTH;
      }

      return this.createMarketingSnippet(options);
    },

    getAccount () {
      if (! this.model.get('account')) {
        this.model.set('account', this.user.initAccount({}));
      }

      return this.model.get('account');
    },

    context () {
      const canSignIn = this._canSignIn();
      const email = this.getAccount().get('email');
      const signInContext = this._getSignInContext();
      const escapedSignInUrl = this._getEscapedSignInUrl(signInContext, email);
      const uap = this._getUap();
      const isAndroid = uap.isAndroid();
      const isFirefoxAndroid = uap.isFirefoxAndroid();
      const isOtherAndroid = isAndroid && ! isFirefoxAndroid;
      const isIos = uap.isIos();
      const isFirefoxIos = uap.isFirefoxIos();
      const isOtherIos = isIos && ! isFirefoxIos;
      const isOther = ! isAndroid && ! isIos;

      let visibleAreaSuffix;
      if (canSignIn) {
        this.notifier.trigger('connectAnotherDevice.signin.eligible');

        if (isFirefoxAndroid) {
          visibleAreaSuffix = 'signin_from.fennec';
        } else {
          visibleAreaSuffix = 'signin_from.desktop';
        }
      } else {
        this.notifier.trigger('connectAnotherDevice.signin.ineligible');

        if (isFirefoxIos) {
          visibleAreaSuffix = 'signin_from.fxios';
        } else if (isOtherIos) {
          visibleAreaSuffix = 'install_from.other_ios';
        } else if (isFirefoxAndroid) {
          visibleAreaSuffix = 'install_from.fennec';
        } else if (isOtherAndroid) {
          visibleAreaSuffix = 'install_from.other_android';
        } else if (isOther) {
          visibleAreaSuffix = 'install_from.other';
        }
      }

      if (visibleAreaSuffix) {
        this.notifier.trigger(`connectAnotherDevice.${visibleAreaSuffix}`);
      }

      return {
        canSignIn,
        email,
        escapedSignInUrl,
        isFirefoxAndroid,
        isFirefoxIos,
        isOther,
        isOtherAndroid,
        isOtherIos
      };
    },

    /**
     * Get the user-agent string. For functional testing
     * purposes, first attempts to fetch a UA string from the
     * `forceUA` query parameter, if that is not found, use
     * the browser's.
     *
     * @returns {String}
     * @private
     */
    _getUserAgentString () {
      return this.getSearchParam('forceUA') || this.window.navigator.userAgent;
    },

    /**
     * Get a user-agent parser instance.
     *
     * @returns {Object}
     * @private
     */
    _getUap () {
      if (! this._uap) {
        const userAgent = this._getUserAgentString();
        this._uap = new UserAgent(userAgent);
      }
      return this._uap;
    },

    /**
     * Check if the current user can sign in.
     *
     * @returns {Boolean}
     * @private
     */
    _canSignIn () {
      // Only users that are not signed in can do so.
      return ! this.model.get('isSignedIn') &&
               this._hasWebChannelSupport();
    },

    /**
     * Check if the current browser has web channel support.
     *
     * @returns {Boolean}
     * @private
     */
    _hasWebChannelSupport () {
      const uap = this._getUap();

        // All Foxes >= 40 except iOS can sign in.
      return uap.isFirefox() &&
           ! uap.isIos() &&
             uap.browser.version >= 40;
    },

    /**
     * Return the sign in context that can be used to sign in
     * to Sync. Assumes the context is only used if the user
     * can actually sign in to Sync.
     *
     * @returns {String}
     * @private
     */
    _getSignInContext() {
      const uap = this._getUap();
      if (uap.isFirefoxAndroid()) {
        return Constants.FX_FENNEC_V1_CONTEXT;
      } else if (uap.isFirefoxDesktop()) {
        // desktop_v3 is safe for all desktop versions that can
        // use WebChannels. The only difference between v2 and v3
        // was the Sync Preferences button, which has since
        // been disabled.
        return Constants.FX_DESKTOP_V3_CONTEXT;
      }
    },

    /**
     * Get an escaped sign in URL.
     *
     * @param {String} context - context to use to sign in
     * @param {String} email - users email address, used to
     *  pre-fill the signin page.
     * @returns {String}
     * @private
     */
    _getEscapedSignInUrl (context, email) {
      const origin = this.window.location.origin;
      const relier = this.relier;

      const params = {
        context,
        email,
        entrypoint: View.ENTRYPOINT,
        service: Constants.SYNC_SERVICE,
        /* eslint-disable camelcase */
        utm_campaign: relier.get('utmCampaign'),
        utm_content: relier.get('utmContent'),
        utm_medium: relier.get('utmMedium'),
        utm_source: relier.get('utmSource'),
        utm_term: relier.get('utmTerm')
        /* eslint-enable camelcase */
      };
      // Url.objToSearchString escapes each of the
      // query parameters.
      const escapedSearchString = Url.objToSearchString(params);

      return `${origin}/signin${escapedSearchString}`;
    },

    /**
     * Log a click on the sign-in button.
     *
     * @private
     */
    _onSignInClick () {
      this.notifier.trigger('connectAnotherDevice.signin.clicked');
    }
  }, {
    ENTRYPOINT: 'connect_another_device'
  });

  Cocktail.mixin(
    View,
    ExperimentMixin,
    MarketingMixin({
      // The marketing area is manually created to which badges are displayed.
      autocreate: false
    })
  );

  module.exports = View;
});

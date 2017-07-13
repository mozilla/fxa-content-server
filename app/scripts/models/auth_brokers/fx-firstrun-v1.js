/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * The auth broker to coordinate authenticating for Sync when
 * embedded in the Firefox firstrun flow.
 */

define(function (require, exports, module) {
  'use strict';

  const _ = require('underscore');
  const FxSyncWebChannelAuthenticationBroker = require('models/auth_brokers/fx-sync-web-channel');
  const NavigateBehavior = require('views/behaviors/navigate');

  var proto = FxSyncWebChannelAuthenticationBroker.prototype;

  var FxFirstrunV1AuthenticationBroker = FxSyncWebChannelAuthenticationBroker.extend({
    type: 'fx-firstrun-v1',

    _iframeCommands: {
      LOADED: 'loaded',
      LOGIN: 'login',
      SIGNUP_MUST_VERIFY: 'signup_must_verify',
      VERIFICATION_COMPLETE: 'verification_complete'
    },

    defaultBehaviors: _.extend({}, proto.defaultBehaviors, {
      afterSignIn: new NavigateBehavior('signin_confirmed')
    }),

    defaultCapabilities: _.extend({}, proto.defaultCapabilities, {
      cadAfterSignUpConfirmationPoll: true,
      chooseWhatToSyncCheckbox: true,
      chooseWhatToSyncWebV1: false,
      openWebmailButtonVisible: true
    }),

    initialize (options) {
      options = options || {};

      this._iframeChannel = options.iframeChannel;
      return proto.initialize.call(this, options);
    },

    afterLoaded () {
      this._iframeChannel.send(this._iframeCommands.LOADED);

      return proto.afterLoaded.apply(this, arguments);
    },

    afterSignIn () {
      // Note, this is a hack. A bedrock request has been made
      // to stop opening FxA w/ the haltAfterSignIn query parameter
      // in https://bugzilla.mozilla.org/show_bug.cgi?id=1380825.
      // Until that patch lands, we'll know bedrock will send
      // users to /settings which on broken browsers with E10s enabled
      // will send users to /signin (see #5229). Stop sending
      // the `login` message to bedrock until they stop redirecting
      // the page to /settings.
      if (this.getSearchParam('haltAfterSignIn') !== 'true') {
        this._iframeChannel.send(this._iframeCommands.LOGIN);
      }

      return proto.afterSignIn.apply(this, arguments);
    },

    afterSignInConfirmationPoll () {
      this._iframeChannel.send(this._iframeCommands.VERIFICATION_COMPLETE);

      return proto.afterSignInConfirmationPoll.apply(this, arguments);
    },

    afterResetPasswordConfirmationPoll () {
      this._iframeChannel.send(this._iframeCommands.VERIFICATION_COMPLETE);

      return proto.afterResetPasswordConfirmationPoll.apply(this, arguments);
    },

    beforeSignUpConfirmationPoll (account) {
      this._iframeChannel.send(this._iframeCommands.SIGNUP_MUST_VERIFY, {
        emailOptIn: !! account.get('needsOptedInToMarketingEmail')
      });

      return proto.beforeSignUpConfirmationPoll.apply(this, arguments);
    },

    afterSignUpConfirmationPoll () {
      this._iframeChannel.send(this._iframeCommands.VERIFICATION_COMPLETE);

      return proto.afterSignUpConfirmationPoll.apply(this, arguments);
    }
  });

  module.exports = FxFirstrunV1AuthenticationBroker;
});

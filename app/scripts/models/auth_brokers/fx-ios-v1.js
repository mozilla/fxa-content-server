/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * The auth broker to coordinate authenticating for Sync when
 * embedded in the Firefox for iOS.
 */

'use strict';

const _ = require('underscore');
const FxIosChannel = require('../../lib/channels/fx-ios-v1');
const FxSyncChannelAuthenticationBroker = require('../auth_brokers/fx-sync-channel');
const HaltBehavior = require('../../views/behaviors/halt');
const NavigateBehavior = require('../../views/behaviors/navigate');
const Url = require('../../lib/url');
const UserAgent = require('../../lib/user-agent');

const proto = FxSyncChannelAuthenticationBroker.prototype;

const FxiOSV1AuthenticationBroker = FxSyncChannelAuthenticationBroker.extend({
  commands: {
    CAN_LINK_ACCOUNT: 'can_link_account',
    CHANGE_PASSWORD: 'change_password',
    DELETE_ACCOUNT: 'delete_account',
    LOADED: 'loaded',
    LOGIN: 'login'
  },

  defaultBehaviors: _.extend({}, proto.defaultBehaviors, {
    // about:accounts displays its own screen after sign in, no need
    // to show anything.
    afterForceAuth: new HaltBehavior(),
    // about:accounts displays its own screen after password reset, no
    // need to show anything.
    afterResetPasswordConfirmationPoll: new HaltBehavior(),
    // about:accounts displays its own screen after sign in, no need
    // to show anything.
    afterSignIn: new HaltBehavior(),
    // about:accounts displays its own screen after sign in, no need
    // to show anything.
    afterSignInConfirmationPoll: new HaltBehavior(),
    // about:accounts displays its own screen after sign in, no need
    // to show anything.
    afterSignUpConfirmationPoll: new HaltBehavior()
  }),

  defaultCapabilities: _.extend({}, proto.defaultCapabilities, {
    chooseWhatToSyncCheckbox: false,
    chooseWhatToSyncWebV1: true,
    convertExternalLinksToText: true
  }),

  initialize (options = {}) {
    proto.initialize.call(this, options);

    const userAgent = new UserAgent(this._getUserAgentString());
    const version = userAgent.parseVersion();

    // We enable then disable this capability if necessary and not the opposite,
    // because initialize() sets chooseWhatToSyncWebV1Engines and
    // new UserAgent() can't be called before initialize().
    if (! this._supportsChooseWhatToSync(version)) {
      this.setCapability('chooseWhatToSyncWebV1', false);
    }

    // Fx for iOS allows the user to see the "confirm your email" screen,
    // but never takes it away after the user verifies. Allow the poll
    // so that the user sees the "Signup complete!" screen after they
    // verify their email.
    this.setBehavior(
      'afterSignInConfirmationPoll', new NavigateBehavior('signin_confirmed'));
    this.setBehavior(
      'afterSignUpConfirmationPoll', new NavigateBehavior('signup_confirmed'));
  },

  createChannel () {
    var channel = new FxIosChannel();

    channel.initialize({
      // Fx Desktop browser will send messages with an origin of the string
      // `null`. These messages are trusted by the channel by default.
      //
      // 1) Fx on iOS and functional tests will send messages from the
      // content server itself. Accept messages from the content
      // server to handle these cases.
      // 2) Fx 18 (& FxOS 1.*) do not support location.origin. Build the origin from location.href
      origin: this.window.location.origin || Url.getOrigin(this.window.location.href),
      window: this.window
    });

    channel.on('error', this.trigger.bind(this, 'error'));

    return channel;
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
   * Check if the browser supports Choose What To Sync
   * for newly created accounts.
   *
   * @param {Object} version
   * @returns {Boolean}
   * @private
   */
  _supportsChooseWhatToSync (version) {
    return version.major >= 11;
  },

  /**
   * Notify the relier of login.
   *
   * @param {Object} account
   * @returns {Promise}
   * @private
   */
  _notifyRelierOfLogin (account) {
    return proto._notifyRelierOfLogin.call(this, account);
  },

  afterCompleteSignInWithCode (account) {
    return this._notifyRelierOfLogin(account);
  },

  afterResetPasswordConfirmationPoll (account) {
    // We wouldn't expect `customizeSync` to be set when completing
    // a password reset, but the field must be present for the login
    // message to be sent. false is the default value set in
    // lib/fxa-client.js if the value is not present.
    // See #5528
    if (! account.has('customizeSync')) {
      account.set('customizeSync', false);
    }

    // Only fx-ios-v1 based integrations send a login message
    // after reset password complete, assuming the user verifies
    // in the same browser. fx-ios-v1 based integrations
    // do not support WebChannels, and the login message must be
    // sent within about:accounts for the browser to receive it.
    // Integrations that support WebChannel messages will send
    // the login message from the verification tab, and for users
    // of either integration that verify in a different browser,
    // they will be asked to signin in this browser using the
    // new password.
    return this._notifyRelierOfLogin(account)
      .then(() => proto.afterResetPasswordConfirmationPoll.call(this, account));
  },
});

module.exports = FxiOSV1AuthenticationBroker;

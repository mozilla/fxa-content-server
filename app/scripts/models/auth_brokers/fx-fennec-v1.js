/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * The auth broker to coordinate authenticating for Sync when
 * embedded in Firefox for Android.
 */

define([
  'lib/promise',
  'models/auth_brokers/fx-desktop-v2',
  'underscore',
  'views/behaviors/navigate'
], function (p, FxDesktopV2AuthenticationBroker, _, NavigateBehavior) {
  'use strict';

  var proto = FxDesktopV2AuthenticationBroker.prototype;

  var FxFennecV1AuthenticationBroker = FxDesktopV2AuthenticationBroker.extend({
    type: 'fx-fennec-v1',

    defaultCapabilities: _.extend({}, proto.defaultCapabilities, {
      chooseWhatToSyncCheckbox: false,
      chooseWhatToSyncWebV1: {
        engines: [
          'bookmarks',
          'history',
          'passwords',
          'tabs'
        ]
      },
      emailVerificationMarketingSnippet: false
    }),

    defaultBehaviors: _.extend({}, proto.defaultBehaviors, {
      afterForceAuth: new NavigateBehavior('force_auth_complete'),
      afterSignIn: new NavigateBehavior('signin_complete'),
      afterSignUpConfirmationPoll: new NavigateBehavior('signup_complete')
    }),

    afterSignUp: function (account) {
      var self = this;
      return p().then(function () {
        if (self.hasCapability('chooseWhatToSyncWebV1')) {
          return new NavigateBehavior('choose_what_to_sync', {
            data: {
              account: account
            }
          });
        }
      });
    }
  });

  return FxFennecV1AuthenticationBroker;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A variant of the FxSync broker that speaks "v3" of the protocol.
 *
 * It used to enable syncPreferencesNotification on the verification complete screen.
 * Issue #4250
 */

define(function (require, exports, module) {
  'use strict';

  const _ = require('underscore');
  const Cocktail = require('cocktail');
  const FxDesktopV2AuthenticationBroker = require('./fx-desktop-v2');
  const UserAgentMixin = require('lib/user-agent-mixin');

  const proto = FxDesktopV2AuthenticationBroker.prototype;

  const FxDesktopV3AuthenticationBroker = FxDesktopV2AuthenticationBroker.extend({
    defaultCapabilities: _.extend({}, proto.defaultCapabilities, {
      allowUidChange: true,
      emailFirst: true,
      tokenCode: false
    }),

    type: 'fx-desktop-v3',

    fetch () {
      return proto.fetch.call(this).then(() => {
        if (this.getUserAgent().parseVersion().major >= 58) {
          this.setCapability('browserTransitionsAfterEmailVerification', false);
        }
      });
    }
  });

  Cocktail.mixin(
    FxDesktopV3AuthenticationBroker,
    UserAgentMixin
  );

  module.exports = FxDesktopV3AuthenticationBroker;
});


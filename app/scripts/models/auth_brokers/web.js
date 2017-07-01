/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Auth broker to handle users who browse directly to the site.
 */

define(function (require, exports, module) {
  'use strict';

  const _ = require('underscore');
  const BaseBroker = require('models/auth_brokers/base');
  const { CONTENT_SERVER_CONTEXT } = require('lib/constants');
  const SessionTernaryBehavior = require('views/behaviors/session-ternary');
  const SettingsAfterVerificationBehavior = require('views/behaviors/settings-after-verification');

  const { defaultBehaviors } = BaseBroker.prototype;

  const settingsAfterVerificationBehavior = new SettingsAfterVerificationBehavior();

  module.exports = BaseBroker.extend({
    defaultBehaviors: _.extend({}, defaultBehaviors, {
      afterCompleteAddSecondaryEmail: new SessionTernaryBehavior(
        settingsAfterVerificationBehavior,
        defaultBehaviors.afterCompleteAddSecondaryEmail
      ),
      afterCompleteResetPassword: settingsAfterVerificationBehavior,
      afterCompleteSignIn: new SessionTernaryBehavior(
        settingsAfterVerificationBehavior,
        defaultBehaviors.afterCompleteSignIn
      ),
      afterCompleteSignUp: new SessionTernaryBehavior(
        settingsAfterVerificationBehavior,
        defaultBehaviors.afterCompleteSignUp
      ),
      afterResetPasswordConfirmationPoll: settingsAfterVerificationBehavior,
      afterSignInConfirmationPoll: settingsAfterVerificationBehavior,
      afterSignUpConfirmationPoll: settingsAfterVerificationBehavior
    }),

    type: CONTENT_SERVER_CONTEXT
  });
});

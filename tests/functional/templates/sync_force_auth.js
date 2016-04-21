/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (registerSuite, TestHelpers, FunctionalHelpers) {
  var thenify = FunctionalHelpers.thenify;

  var clearBrowserState = thenify(FunctionalHelpers.clearBrowserState);
  var createUser = FunctionalHelpers.createUser;
  var fillOutForceAuth = FunctionalHelpers.fillOutForceAuth;
  var listenForSyncCommands = FunctionalHelpers.listenForSyncCommands;
  var openForceAuth = FunctionalHelpers.openForceAuth;
  var testElementExists = FunctionalHelpers.testElementExists;
  var testIsBrowserNotifiedOfLogin = FunctionalHelpers.testIsBrowserNotifiedOfLogin;
  var testNoScreenTransition = FunctionalHelpers.testNoScreenTransition;
  var testSyncPreferencesButtonClick = FunctionalHelpers.testSyncPreferencesButtonClick;

  var PASSWORD = '12345678';

  var setupTest = thenify(function (config, user) {
    var channelType = config.useWebChannelCommands ? 'web_channel' : 'fx_desktop';
    return this.parent
      .then(clearBrowserState(this))
      .then(createUser(user.email, user.password, {
        preVerified: user.preVerified
      }))
      .then(openForceAuth({ query: {
        context: config.context,
        email: user.email,
        service: 'sync'
      }}))
      .then(listenForSyncCommands(channelType));
  });

  return function (config, additionalTests) {
    var suite = {
      name: config.name,

      'registered verified email, no uid': function () {
        var user = {
          email: TestHelpers.createEmail(),
          password: PASSWORD,
          preVerified: true
        };

        return this.remote
          .then(setupTest(config, user))
          .then(fillOutForceAuth(user.password))
          .then(testIsBrowserNotifiedOfLogin(
                config.canLinkAccountMessage, config.loginMessage))
          .then(function () {
            if (config.syncPreferencesCommand) {
              return testSyncPreferencesButtonClick(config.syncPreferencesCommand).call(this);
            } else {
              return testNoScreenTransition('#fxa-force-auth-header').call(this);
            }
          });
      },

      'registered unverified email, no uid': function () {
        var user = {
          email: TestHelpers.createEmail(),
          password: PASSWORD,
          preVerified: false
        };

        return this.remote
          .then(setupTest(config, user))
          .then(fillOutForceAuth(user.password))
          .then(testElementExists('#fxa-confirm-header'))
          .then(testIsBrowserNotifiedOfLogin(
                config.canLinkAccountMessage, config.loginMessage));
      }
    };

    for (var testName in additionalTests) {
      suite[testName] = additionalTests[testName];
    }

    registerSuite(suite);
  };
});


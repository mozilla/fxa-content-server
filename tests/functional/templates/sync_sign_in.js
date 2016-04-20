/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers',
  'tests/functional/lib/fx-desktop',
], function (registerSuite, TestHelpers, FunctionalHelpers, FxDesktopHelpers) {
  var thenify = FunctionalHelpers.thenify;

  var clearBrowserState = thenify(FunctionalHelpers.clearBrowserState);
  var click = FunctionalHelpers.click;
  var createUser = FunctionalHelpers.createUser;
  var fillOutSignIn = thenify(FunctionalHelpers.fillOutSignIn);
  var listenForFxaCommands = FxDesktopHelpers.listenForFxaCommands;
  var noSuchBrowserNotification = FunctionalHelpers.noSuchBrowserNotification;
  var noSuchElement = FunctionalHelpers.noSuchElement;
  var openSignIn = FunctionalHelpers.openSignIn;
  var respondToWebChannelMessage = FunctionalHelpers.respondToWebChannelMessage;
  var testElementExists = FunctionalHelpers.testElementExists;
  var testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;

  var email;
  var PASSWORD = '12345678';

  var listenForSyncCommands = thenify(function(config) {
    if (config.useFxAccountsCommands) {
      return this.parent.execute(listenForFxaCommands);
    } else if (config.useWebChannelCommands) {
      return this.parent
        .then(respondToWebChannelMessage(this, config.canLinkAccountMessage, { ok: true } ));
    }
  });

  var setupTest = thenify(function (config, isUserVerified) {
    return this.parent
      .then(clearBrowserState(this))
      .then(createUser(email, PASSWORD, { preVerified: isUserVerified }))
      .then(openSignIn({ query: {
        context: config.context,
        email: email,
        service: 'sync'
      }}))
      .then(listenForSyncCommands(config));
  });

  function testSyncPreferencesButton(syncPreferencesCommand) {
    return this.parent
      .then(noSuchBrowserNotification(this, syncPreferencesCommand))
      // user wants to open sync preferences.
      .then(click('#sync-preferences'))

      // browser is notified of desire to open Sync preferences
      .then(testIsBrowserNotified(this, syncPreferencesCommand));
  }

  function testNoScreenTransition() {
    return this.parent
      // add a slight delay to ensure the page does not transition
      .sleep(2000)

      // the page does not transition.
      .then(testElementExists('#fxa-signin-header'))
      .then(noSuchElement(this, '#sync-preferences'));
  }


  return function (config, additionalTests) {
    var suite = {
      name: config.name,

      beforeEach: function () {
        email = TestHelpers.createEmail();
      },

      'verified': function () {
        return this.remote
          .then(setupTest(config, true))
          .then(fillOutSignIn(this, email, PASSWORD))
          .then(testIsBrowserNotified(this, config.canLinkAccountMessage))
          .then(testIsBrowserNotified(this, config.loginMessage))
          .then(function () {
            if (config.syncPreferencesCommand) {
              return testSyncPreferencesButton.call(this, config.syncPreferencesCommand);
            } else {
              return testNoScreenTransition.call(this);
            }
          });
      },

      'unverified': function () {
        return this.remote
          .then(setupTest(config, false))
          .then(fillOutSignIn(this, email, PASSWORD))
          .then(testElementExists('#fxa-confirm-header'))
          .then(testIsBrowserNotified(this, config.canLinkAccountMessage))
          .then(testIsBrowserNotified(this, config.loginMessage));
      }
    };

    for (var testName in additionalTests) {
      suite[testName] = additionalTests[testName];
    }

    registerSuite(suite);
  };
});


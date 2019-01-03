/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const selectors = require('./lib/selectors');
const TestHelpers = require('../lib/helpers');
const FunctionalHelpers = require('./lib/helpers');
const config = intern._config;

const SIGNUP_PAGE_URL = `${config.fxaContentRoot}signup?context=fx_desktop_v3&service=sync`;
//const PAIR_URL = `${config.fxaContentRoot}pair/supp?client_id=dcdb5ae7add825d2&redirect_uri=
// https%3A%2F%2F123done-pairsona.dev.lcip.org%2Fapi%2Foauth&scope=https%3A%2F%2Fidentity.mozilla.com%2Fapps%2Foldsync&state=
// SmbAA_9EA5v1R2bgIPeWWw&code_challenge_method=S256&code_challenge=ZgHLPPJ8XYbXpo7VIb7wFw0yXlTa6MUOVfGiADt0JSM&access_type=
// offline&keys_jwk=eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6Ing5LUltQjJveDM0LTV6c1VmbW5sNEp0Ti14elV2eFZlZXJHTFRXRV9BT0kiLCJ
// 5IjoiNXBKbTB3WGQ4YXdHcm0zREl4T1pWMl9qdl9tZEx1TWlMb1RkZ1RucWJDZyJ9#channel_key=1hIDzTj5oY2HDeSg_jA2DhcOcAn5Uqq0cAYlZRNU
// Io4&channel_id=`;
const PAIR_URL = `${config.fxaContentRoot}pair/supp?client_id=dcdb5ae7add825d2&redirect_uri=http%3A%2F%2F127.0.0.1%3A8080%2Fapi%2Foauth&scope=https%3A%2F%2Fidentity.mozilla.com%2Fapps%2Foldsync&state=SmbAA_9EA5v1R2bgIPeWWw&code_challenge_method=S256&code_challenge=ZgHLPPJ8XYbXpo7VIb7wFw0yXlTa6MUOVfGiADt0JSM&access_type=offline&keys_jwk=eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6Ing5LUltQjJveDM0LTV6c1VmbW5sNEp0Ti14elV2eFZlZXJHTFRXRV9BT0kiLCJ5IjoiNXBKbTB3WGQ4YXdHcm0zREl4T1pWMl9qdl9tZEx1TWlMb1RkZ1RucWJDZyJ9`; //eslint-disable-line  max-len

const PASSWORD = '12345678';
let email;

const {
  closeCurrentWindow,
  click,
  openPage,
  openTab,
  openVerificationLinkInNewTab,
  switchToWindow,
  visibleByQSA,
  fillOutSignUp,
  testElementExists,
  testIsBrowserNotified,
} = FunctionalHelpers;

registerSuite('pairing', {
  tests: {
    'it can pair': function () {
      email = TestHelpers.createEmail('sync{id}');

      return this.remote
        .then(openPage(SIGNUP_PAGE_URL, selectors.SIGNUP.HEADER))
        .then(visibleByQSA(selectors.SIGNUP.SUB_HEADER))

        .then(fillOutSignUp(email, PASSWORD))

        .then(testElementExists(selectors.CHOOSE_WHAT_TO_SYNC.HEADER))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))
        .then(openVerificationLinkInNewTab(email, 0))
        .then(switchToWindow(1))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.SUCCESS))
        // switch back to the original window, it should transition to CAD.
        .then(closeCurrentWindow())

        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.SUCCESS))
        // but the login message is sent automatically.
        .then(testIsBrowserNotified('fxaccounts:login'))

        .then(openPage('about:preferences#sync', '#beginPairing'))
        .then(click('#beginPairing'))

        .sleep(30 * 91000)
        .sleep(1000)
        .getAlertText()
        .then((alert) => {
          const [channelId, channelKey] = alert.split('#');
          console.log(alert);
          return this.remote
            .acceptAlert()
            .end()

            .then(openTab(PAIR_URL + '#channel_id=' + channelId + '&channel_key=' + channelKey, selectors.SIGNUP.HEADER));
        })
        .end()
        .sleep(30 * 90000);

    }
  }
});

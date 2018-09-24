/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const selectors = require('./lib/selectors');
const TestHelpers = require('../lib/helpers');
const FunctionalHelpers = require('./lib/helpers');
const config = intern._config;

const SIGNUP_PAGE_URL = `${config.fxaContentRoot}signup?context=fx_desktop_v3&service=sync`;
const REDIRECT_HOST = encodeURIComponent(config.fxaContentRoot);
const PAIR_URL = `${config.fxaContentRoot}pair/supp?response_type=code&client_id=3c49430b43dfba77&redirect_uri=${REDIRECT_HOST}oauth%2Fsuccess%2F3c49430b43dfba77&scope=profile%2Bhttps%3A%2F%2Fidentity.mozilla.com%2Fapps%2Foldsync&state=foo&code_challenge_method=S256&code_challenge=IpOAcntLUmKITcxI_rDqMvFTeC9n_g0B8_Pj2yWZp7w&access_type=offline&keys_jwk=eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImlmcWY2U1pwMlM0ZjA5c3VhS093dmNsbWJxUm8zZXdGY0pvRURpYnc4MTQiLCJ5IjoiSE9LTXh5c1FseExqRGttUjZZbFpaY1Y4MFZBdk9nSWo1ZHRVaWJmYy1qTSJ9`; //eslint-disable-line  max-len

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

function getQrData(buffer) {
  return new Promise(function (resolve, reject) {
    const Jimp = require('jimp');
    const QrCode = require('qrcode-reader');
    Jimp.read(buffer, (err, image) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      const qr = new QrCode();
      qr.callback = (err, value) => {
        if (err) {
          console.error(err);
          return reject(err);
        } else {
          return resolve(value.result);
        }
      };
      qr.decode(image.bitmap);
    });
  });
}

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

        .then(openPage('about:preferences#sync', selectors.PAIRING.START_PAIRING))
        .then(click(selectors.PAIRING.START_PAIRING))

        // TODO: this can be optimized to poll for a readable QR code instead of a timeout
        .sleep(3000)
        .takeScreenshot()
        .then((buffer) => {
          return getQrData(buffer)
            .then((result) => {
              const pairingStuff = result.split('#')[1];
              return this.remote
                .then(openTab(PAIR_URL + '#' + pairingStuff, selectors.SIGNUP.HEADER));
            });
        })

        .then(switchToWindow(1))
        .then(click(selectors.PAIRING.SUPP_SUBMIT))
        .catch((err) => {
          if (err.message && err.message.includes('Web element reference')) {
            // We have to catch an error here due to https://bugzilla.mozilla.org/show_bug.cgi?id=1422769
            // .click still works, but just throws for no reason. We assert below that pairing still works.
          } else {
            // if this is an unknown error, then we throw
            throw err;
          }
        })
        .then(switchToWindow(0))
        .then(click(selectors.PAIRING.AUTH_SUBMIT))

        .then(switchToWindow(1))
        .then(testElementExists(selectors.PAIRING.REDIRECTED))
        .getCurrentUrl()
        .then(function (redirectResult) {
          assert.ok(redirectResult.includes('code='), 'final OAuth redirect has the code');
          assert.ok(redirectResult.includes('state='), 'final OAuth redirect has the state');
        })
        .end();
    }
  }
});

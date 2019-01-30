/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const got = require('got');
const serverUrl = intern._config.fxaContentRoot.replace(/\/$/, '');

registerSuite('routes/get-frontend-pairing', {
  tests: {
    'direct navigation to pairing routes redirects': function () {
      const PAIRING_ROUTES = [
        'pair/auth/allow',
        'pair/auth/complete',
        'pair/auth/wait_for_supp',
        'pair/supp/allow',
        'pair/supp/wait_for_auth',
      ];
      const dfd = this.async(intern._config.asyncTimeout);
      let responses = 0;

      PAIRING_ROUTES.forEach((route) => {

        got(`${serverUrl}/${route}`, {})
          .then(function (res) {
            assert.equal(res.requestUrl, `${serverUrl}/${route}`);
            assert.equal(res.url, `${serverUrl}/pair/failure`);
            responses++;
            if (responses === PAIRING_ROUTES.length) {
              dfd.resolve();
            }
          });
      });

      return dfd;
    }
  }
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const config = require('../../server/lib/configuration');
const csp = require('../../server/lib/csp');
const htmlparser2 = require('htmlparser2');
const got = require('got');
const url = require('url');
const Promise = require('intern/browser_modules/dojo/Promise');
const routesHelpers = require('tests/server/helpers/routesHelpers');
const fxaShared = require('fxa-shared');
const dnshook = require('./lib/dnshook');

var checkHeaders = routesHelpers.checkHeaders;
var extractAndCheckUrls = routesHelpers.extractAndCheckUrls;
var makeRequest = routesHelpers.makeRequest;

var languages = fxaShared.l10n.supportedLanguages;
var httpsUrl = intern._config.fxaContentRoot.replace(/\/$/, '');

var hookDns = process.env.FXA_DNS_ELB && process.env.FXA_DNS_ALIAS;

if (intern._config.fxaProduction) {
  assert.equal(0, httpsUrl.indexOf('https://'), 'uses https scheme');
}

var dnsSuite = {
  name: 'confirm that dns.lookup is called via makeRequest by aliasing non-existent domain',
  setup: function () {
    if (hookDns) {
      dnshook('nxdomain.nxdomain.nxdomain', process.env.FXA_DNS_ALIAS);
    }
  },
  teardown: function () {
    dnshook(false);
  }
};

dnsSuite['#https get ' + httpsUrl + '/signin fails if non-existent domain'] = function () {
  var dfd = this.async(2000);

  makeRequest(httpsUrl + '/signin', {})
    .then((res) => {
      if (hookDns) {
        // If we've hooked dns, then this should fail. But `makeRequest`
        // squelches errors, so "failure" means `res` will be undefined.
        assert.ok(res === undefined);
      } else {
        // Otherwise, if we haven't hooked dns, then this should succeed.
        assert.equal(res.statusCode, 200);
      }
    })
    .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));

  return dfd;
};

registerSuite(dnsSuite);

var suite = {
  name: 'check resources entrained by /signin in all locales',
  setup: function () {
    if (hookDns) {
      dnshook(process.env.FXA_DNS_ELB, process.env.FXA_DNS_ALIAS);
    }
  },
  teardown: function () {
    dnshook(false);
  }
};

var routes = {
  '/signin': { statusCode: 200 }
};

Object.keys(routes).forEach(function (key) {
  languages.forEach(function (lang) {
    var requestOptions = {
      headers: {
        'Accept': routes[key].headerAccept || 'text/html',
        'Accept-Language': lang
      }
    };

    routeTest(key, routes[key].statusCode, requestOptions);
  });
});

registerSuite(suite);

function routeTest(route, expectedStatusCode, requestOptions) {
  suite['#https get ' + httpsUrl + route + ' ' + requestOptions.headers['Accept-Language']] = function () {
    var dfd = this.async(intern._config.asyncTimeout);

    makeRequest(httpsUrl + route, requestOptions)
      .then((res) => {
        assert.equal(res.statusCode, expectedStatusCode);
        checkHeaders(routes, route, res);

        return res;
      })
      .then(extractAndCheckUrls)
      .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));

    return dfd;
  };
}

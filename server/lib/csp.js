/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Middleware to take care of CSP. CSP headers are not sent unless config
// option 'csp.enabled' is set (default true in development), with a special
// exception for the /tests/index.html path, which are the frontend unit
// tests.

var config = require('./configuration');
var helmet = require('helmet');
var url = require('url');

var BLOB = 'blob:';
var CDN_URL = config.get('static_resource_url');
var DATA = 'data:';
var GRAVATAR = 'https://secure.gravatar.com';
var PUBLIC_URL = config.get('public_url');
var SELF = "'self'";

function addCdnRuleIfRequired(target) {
  if (CDN_URL !== PUBLIC_URL) {
    target.push(CDN_URL);
  }
  return target;
}

function isCspRequired(path) {
  // is the user running tests? No CSP.
  return path !== '/tests/index.html' &&
         ! /\.(js|json|css|woff|ttf|eot|svg|mustache)$/.test(path);
}

function getOrigin(link) {
  var parsed = url.parse(link);
  return parsed.protocol + '//' + parsed.host;
}

/**
 * blockingCspMiddleware is where to declare rules that will cause a resource
 * to be blocked if it runs afowl of a rule.
 */
var blockingCspMiddleware = helmet.csp({
  connectSrc: [
    SELF,
    getOrigin(config.get('fxaccount_url')),
    config.get('oauth_url'),
    config.get('profile_url'),
    config.get('marketing_email.api_url')
  ],
  defaultSrc: [SELF],
  fontSrc: addCdnRuleIfRequired([
    SELF
  ]),
  imgSrc: addCdnRuleIfRequired([
    SELF,
    DATA,
    GRAVATAR,
    config.get('profile_images_url')
  ]),
  mediaSrc: [BLOB],
  reportOnly: false,
  reportUri: config.get('csp.reportUri'),
  scriptSrc: addCdnRuleIfRequired([
    // allow unsafe-eval for functional tests. A report-only middleware
    // is also added that does not allow 'unsafe-eval' so that we can see
    // if other scripts are being added.
    SELF, "'unsafe-eval'"
  ]),
  styleSrc: addCdnRuleIfRequired([
    SELF,
    // The sha of the embedded <style> tag in default-profile.svg.
    "'sha256-9n6ek6ecEYlqel7uDyKLy6fdGNo3vw/uScXSq9ooQlk='"
  ])
});

/**
 * reportOnlyCspMiddleware is where to declare experimental rules that
 * will not cause a resource to be blocked if it runs afowl of a rule, but will
 * cause the resource to be reported.
 */
var reportOnlyCspMiddleware = helmet.csp({
  reportOnly: true,
  reportUri: config.get('csp.reportUri'),
  scriptSrc: addCdnRuleIfRequired([
    SELF
  ])
});

module.exports = function (req, res, next) {
  if (! isCspRequired(req.path)) {
    return next();
  }

  blockingCspMiddleware(req, res, function () {
    reportOnlyCspMiddleware(req, res, next);
  });
};

module.exports.isCspRequired = isCspRequired;

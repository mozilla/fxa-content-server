/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var flowMetrics = require('../flow-metrics');

module.exports = function (config) {
  var STATIC_RESOURCE_URL = config.get('static_resource_url');
  var FLOW_ID_KEY = config.get('flow_id_key');

  var allowedParentOrigins = config.get('allowed_parent_origins');
  var authServerUrl = config.get('fxaccount_url');
  var clientId = config.get('oauth_client_id');
  var env = config.get('env');
  var marketingEmailApiServerUrl = config.get('marketing_email.api_url');
  var marketingEmailPreferencesUrl = config.get('marketing_email.preferences_url');
  var oauthServerUrl = config.get('oauth_url');
  var profileServerUrl = config.get('profile_url');

  var serializedConfig = encodeURIComponent(JSON.stringify({
    allowedParentOrigins: allowedParentOrigins,
    authServerUrl: authServerUrl,
    env: env,
    marketingEmailPreferencesUrl: marketingEmailPreferencesUrl,
    marketingEmailServerUrl: marketingEmailApiServerUrl,
    oAuthClientId: clientId,
    oAuthUrl: oauthServerUrl,
    profileUrl: profileServerUrl
  }));

  var route = {};
  route.method = 'get';
  route.path = '/';

  route.process = function (req, res) {
    var flowEventData = flowMetrics(FLOW_ID_KEY, req.headers['user-agent']);

    res.render('index', {
      config: serializedConfig,
      flowBeginTime: flowEventData.flowBeginTime,
      flowId: flowEventData.flowId,
      // Note that staticResourceUrl is added to templates as a build step
      staticResourceUrl: STATIC_RESOURCE_URL
    });
  };

  return route;
};


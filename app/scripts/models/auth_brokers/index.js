/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Constants = require('lib/constants');

  const DEFINITIONS = [
    {
      context: Constants.FX_DESKTOP_V1_CONTEXT,
      definition: require('models/auth_brokers/fx-desktop-v1')
    },
    {
      context: Constants.FX_DESKTOP_V2_CONTEXT,
      definition: require('models/auth_brokers/fx-desktop-v2')
    },
    {
      context: Constants.FX_DESKTOP_V3_CONTEXT,
      definition: require('models/auth_brokers/fx-desktop-v3')
    },
    {
      context: Constants.FX_FENNEC_V1_CONTEXT,
      definition: require('models/auth_brokers/fx-fennec-v1')
    },
    {
      context: Constants.FX_FIRSTRUN_V1_CONTEXT,
      definition: require('models/auth_brokers/fx-firstrun-v1')
    },
    {
      context: Constants.FX_FIRSTRUN_V2_CONTEXT,
      definition: require('models/auth_brokers/fx-firstrun-v2')
    },
    {
      context: Constants.FX_IOS_V1_CONTEXT,
      definition: require('models/auth_brokers/fx-ios-v1')
    },
    {
      context: Constants.OAUTH_CONTEXT,
      definition: require('models/auth_brokers/redirect')
    }
  ].reduce((authBrokers, authBroker) => {
    authBrokers[authBroker.context] = authBroker.definition;
    return authBrokers;
  }, {});

  /**
   * @typedef AuthBrokerDefinition
   * @property {Function} Constructor
   * @property {Array} options
   */
  module.exports = {
    /**
     * Return the appropriate auth broker definition for the given context.
     *
     * @param {String} context
     * @returns {AuthBrokerDefinition}
     */
    get (context) {
      return DEFINITIONS[context] || require('models/auth_brokers/base');
    }
  };
});

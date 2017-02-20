/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Common patterns and types used for POST data validation.
 */

const joi = require('joi');

module.exports = {
  TYPES: {
    INTEGER: joi.number().integer(),
    STRING: joi.string(),
    URL: joi.string().uri({ scheme: [ 'http', 'https' ]})
  }
};

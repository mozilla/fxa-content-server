/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * List of SMS error codes.
 * From https://docs.nexmo.com/messaging/sms-api/api-reference#status-codes
 */
define((require, exports, module) => {
  'use strict';

  const _ = require('underscore');
  const Errors = require('lib/errors');
  const t = msg => msg;

  const COULD_NOT_SEND = t('Could not send SMS');

  /*eslint-disable sorting/sort-object-props*/
  const ERRORS = {
    SUCCESS: {
      errno: 0,
      message: t('SMS sent')
    },
    THROTTLED: {
      errno: 1,
      message: COULD_NOT_SEND
    },
    MISSING_PARAMETER: {
      errno: 2,
      message: COULD_NOT_SEND
    },
    INVALID_PARAMETER: {
      errno: 3,
      message: COULD_NOT_SEND
    },
    INVALID_CREDENTIALS: {
      errno: 4,
      message: COULD_NOT_SEND
    },
    INTERNAL_ERROR: {
      errno: 5,
      message: COULD_NOT_SEND
    },
    UNROUTABLE_MESSAGE: {
      errno: 6,
      message: t('Phone number invalid')
    },
    NUMBER_BLOCKED: {
      errno: 7,
      message: t('Your number has been blocked')
    },
    PARTNER_ACCOUNT_BLOCKED: {
      errno: 8,
      message: COULD_NOT_SEND
    },
    PARTNER_QUOTA_EXCEEDED: {
      errno: 9,
      message: COULD_NOT_SEND
    },
    ACCOUNT_NOT_ENABLED_FOR_REST: {
      errno: 11,
      message: COULD_NOT_SEND
    },
    MESSAGE_TOO_LONG: {
      errno: 12,
      message: COULD_NOT_SEND
    },
    COMMUNICATION_FAILED: {
      errno: 13,
      message: COULD_NOT_SEND
    },
    INVALID_SIGNATURE: {
      errno: 14,
      message: COULD_NOT_SEND
    },
    ILLEGAL_SENDER_ADDRESS: {
      errno: 15,
      message: COULD_NOT_SEND
    },
    INVALID_TTL: {
      errno: 16,
      message: COULD_NOT_SEND
    },
    FACILITY_NOT_ALLOWED: {
      errno: 19,
      message: COULD_NOT_SEND
    },
    INVALID_MESSAGE_CLASS: {
      errno: 20,
      message: COULD_NOT_SEND
    },
    MISSING_PROTOCOL: {
      errno: 23,
      message: COULD_NOT_SEND
    },
    DESTINATION_NOT_ALLOWED: {
      errno: 29,
      message: COULD_NOT_SEND
    },
    INVALID_PHONE_NUMBER: {
      errno: 34,
      message: t('Phone number invalid')
    }

  };
  /*eslint-enable sorting/sort-object-props*/


  module.exports = _.extend({}, Errors, {
    ERRORS: ERRORS,
    NAMESPACE: 'sms'
  });
});

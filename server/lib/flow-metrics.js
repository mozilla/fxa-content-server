/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const crypto = require('crypto');

const SALT_SIZE = 16;
const SALT_STRING_LENGTH = SALT_SIZE * 2;

const ANONYMOUS_FLOW_ID = new Array(64).fill('0').join('');

module.exports = {
  /**
   * Create flow data.
   *
   * @param key String
   * @param userAgent String
   * @returns {{flowBeginTime: number, flowId: string}}
   */
  create (key, userAgent) {
    const salt = crypto.randomBytes(SALT_SIZE).toString('hex');
    const result = createFlowEventData(key, salt, Date.now(), userAgent);

    if (result === ANONYMOUS_FLOW_ID) {
      return this.create(key, userAgent);
    }

    return result;
  },

  /**
   * Check whether a flowId is valid.
   *
   * @param key String
   * @param flowId String
   * @param flowBeginTime Number
   * @param userAgent String
   * @returns Boolean
   */
  validate (key, flowId, flowBeginTime, userAgent) {
    if (flowId === ANONYMOUS_FLOW_ID) {
      return false;
    }

    const salt = flowId.substr(0, SALT_STRING_LENGTH);
    const expected = createFlowEventData(key, salt, flowBeginTime, userAgent);

    return getFlowSignature(flowId) === getFlowSignature(expected.flowId);
  },

  /**
   * Return the anonymous flowId, used for emitting special events
   * that we do not want to link to any flows or users.
   *
   * @returns flowId
   */
  getAnonymousFlowId (key) {
    return ANONYMOUS_FLOW_ID;
  }
};

function createFlowEventData(key, salt, flowBeginTime, userAgent) {
  // Incorporate a hash of request metadata into the flow id,
  // so that receiving servers can cross-check the metrics bundle.
  const flowSignature = crypto.createHmac('sha256', key)
    .update([
      salt,
      flowBeginTime.toString(16),
      userAgent
    ].join('\n'))
    .digest('hex')
    .substr(0, SALT_STRING_LENGTH);

  return {
    flowBeginTime: flowBeginTime,
    flowId: salt + flowSignature
  };
}

function getFlowSignature (flowId) {
  return flowId.substr(SALT_STRING_LENGTH);
}

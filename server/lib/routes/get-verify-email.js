/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const got = require('got');
const logger = require('mozlog')('server.get-verify-email');
const config = require('../configuration');
const joi = require('joi');
const validation = require('../validation');

const fxaAccountUrl = config.get('fxaccount_url');
const STRING_TYPE = validation.TYPES.STRING;

const BODY_SCHEMA = {
  'code': STRING_TYPE.alphanum().min(32).max(32).required(),
  'uid': STRING_TYPE.alphanum().min(32).max(32).required()
};

module.exports = function () {

  return {
    method: 'get',
    path: '/verify_email',
    process: function (req, res, next) {
      req.url = '/';

      const data = {
        code: req.query.code,
        uid: req.query.uid
      };

      joi.validate(data, BODY_SCHEMA, function (err, value) {
        if (err) {
          logger.error(err);
          next();
        } else {
          if (req.query.service) {
            data.service = req.query.service;
          }

          if (req.query.reminder) {
            data.reminder = req.query.reminder;
          }

          got.post(`${fxaAccountUrl}/v1/recovery_email/verify_code`, {
            body: data
          }).then(function (res) {
            // verified, all good
            next();
          }).catch(function (err) {
            // something went wrong....
            logger.error(err);
            next();
          });
        }
      });
    }
  };
};

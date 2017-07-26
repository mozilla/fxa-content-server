/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const Account = require('models/account');
  const Experiment = require('lib/experiments/grouping-rules/send-sms-install-link');
  const sinon = require('sinon');

  describe('lib/experiments/grouping-rules/q3-form-changes', () => {
    let account;
    let experiment;

    before(() => {
      account = new Account();
      experiment = new Experiment();
    });

    describe('choose', () => {

    });
  });
});

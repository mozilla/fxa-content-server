/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A model to hold signin authorization verification data
 */

define(function (require, exports, module) {
  'use strict';

  const Vat = require('lib/vat');
  const VerificationInfo = require('./base');

  module.exports = VerificationInfo.extend({
    defaults: {
      code: null,
      email: null,
      uid: null,
    },

    validation: {
      code: Vat.code(),
      email: Vat.email(),
      uid: Vat.uid()
    }
  });
});


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Behavior sends users to /settings after verifying their email.
 */

define(function (require, exports, module) {
  'use strict';

  const NavigateBehavior = require('views/behaviors/navigate');
  const t = (msg) => msg;

  module.exports = function () {
    return new NavigateBehavior('settings', {
      success: t('Account verified successfully')
    });
  };
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const BaseView = require('views/base');
  const Complete2FATemplate = require('stache!templates/complete_2fa');

  const Complete2FAView = BaseView.extend({
    template: Complete2FATemplate,

    setInitialContext (context) {
      context.set('isSync', this.relier.isSync());
    }
  });

  module.exports = Complete2FAView;
});


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var FormView = require('views/form');
  var Template = require('stache!templates/complete_sign_in');

  var View = FormView.extend({
    template: Template,

    beforeRender: function () {
      var self = this;
      self.navigate('signin_confirmed');
    }
  });

  module.exports = View;
});

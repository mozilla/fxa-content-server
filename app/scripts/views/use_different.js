/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'views/sign_in',
  'stache!templates/sign_in'
],
function (SignInView, Template) {

  var View = SignInView.extend({
    template: Template,
    className: 'use-different',

    context: function () {
      return {
        error: this.error
      };
    }

  });

  return View;
});

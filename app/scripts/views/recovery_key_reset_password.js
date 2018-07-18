/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cocktail = require('cocktail');
const FormView = require('./form');
const Template = require('templates/recovery_key_reset_password.mustache');

const View = FormView.extend({
  className: 'recovery-key-reset_password',
  template: Template,

  beforeRender() {
  },

  setInitialContext(context) {
    const account = this.getSignedInAccount();
    context.set({
      email: account.get('email')
    });
  },

  submit() {
    this.navigate('reset_password_verified');
  },
});

Cocktail.mixin(
  View
);

module.exports = View;

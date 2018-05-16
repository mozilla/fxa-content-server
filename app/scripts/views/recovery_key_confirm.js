/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cocktail = require('cocktail');
const FormView = require('./form');
const Template = require('templates/recovery_key_confirm.mustache');

const View = FormView.extend({
  className: 'recovery-key-confirm',
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
    this.navigate('/recovery_key_reset_password');
  },
});

Cocktail.mixin(
  View
);

module.exports = View;

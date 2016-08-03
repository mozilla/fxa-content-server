/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const Constants = require('lib/constants');
  const FormView = require('views/form');
  const Template = require('stache!templates/confirm_signin_authorization');

  const View = FormView.extend({
    template: Template,
    className: 'confirm_signin_authorization',

    // used by unit tests
    VERIFICATION_POLL_IN_MS: Constants.VERIFICATION_POLL_IN_MS,

    initialize () {
      this._account = this.model.get('account');
      $('#fox-logo').one('click', (event) => {
        event.preventDefault();
        this.navigate('/complete_signin_authorization', {
          account: this._account
        });
      });
    },

    getAccount () {
      return this._account;
    },

    context () {
      return {
        email: this._account.get('email')
      };
    }
  });

  module.exports = View;
});

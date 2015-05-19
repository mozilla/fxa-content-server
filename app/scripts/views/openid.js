/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'cocktail',
  'views/base',
  'stache!templates/openid',
  'lib/session'
],
function (Cocktail, BaseView, Template, Session) {
  'use strict';

  var View = BaseView.extend({
    template: Template,
    className: 'openid-sign-in',

    initialize: function (options) {
      BaseView.prototype.initialize.call(this, options);
      options = options || {};

      this._err = this.relier.get('err');
      this._uid = this.relier.get('uid');
      this._sessionToken = this.relier.get('session');
      this._keyFetchToken = this.relier.get('key');
      this._unwrapBKey = this.relier.get('unwrap');
      this._email = this.relier.get('email')
      Session.clear();
      this.user.clearSignedInAccount();
    },

    beforeRender: function () {
      var self = this;
      if (self._err) {
        throw new Error(self._err);
      }
      var account = self.user.initAccount({
        uid: self._uid,
        sessionToken: self._sessionToken,
        keyFetchToken: self._keyFetchToken,
        verified: true,
        unwrapBKey: this._unwrapBKey,
        email: this._email
      });

      return self.user.setSignedInAccount(account)
        .then(function () {
          self.logScreenEvent('success');
          return self.broker.afterSignIn(account)
            .then(function (result) {
              self.navigate('settings');
              return result;
            });
        });
    },

    context: function () {
      return {};
    }
  });

  Cocktail.mixin(
    View
  );

  return View;
});

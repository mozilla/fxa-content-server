/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'cocktail',
  'lib/constants',
  'lib/promise',
  'views/mixins/inter-tab-channel-mixin'
],
function (cocktail, constants, p, interTabChannelMixin) {
  'use strict';

  var EVENTS = constants.EVENTS;

  return cocktail.mixin({
    afterVisible: function () {
      this.navigateToSignedInView = navigateToSignedInView.bind(this);
      this.interTabOn(EVENTS.SIGNIN_SUCCESS, this.navigateToSignedInView);
    },

    onSignInSuccess: function (account) {
      this.interTabOff(EVENTS.SIGNIN_SUCCESS, this.navigateToSignedInView);
      this.interTabSend(EVENTS.SIGNIN_SUCCESS, account);
    }
  }, interTabChannelMixin);

  function navigateToSignedInView (event) {
    if (this.broker.hasCapability('interTabSignIn')) {
      var self = this;
      return this.user.setSignedInAccount(event.data)
        .then(function () {
          self.navigate(self._redirectTo || 'settings');
        });
    }

    return p();
  }
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'cocktail',
  'lib/constants',
  'lib/session',
  'views/base',
  'views/mixins/inter-tab-channel-mixin'
],
function (Cocktail, Constants, Session, BaseView, InterTabChannelMixin) {
  'use strict';

  var EVENTS = Constants.EVENTS;
  var t = BaseView.t;

  return Cocktail.mixin({
    afterVisible: function () {
      this.clearSessionAndNavigateToSignIn = clearSessionAndNavigateToSignIn.bind(this);
      this.interTabOn(EVENTS.SIGNOUT_SUCCESS, this.clearSessionAndNavigateToSignIn);
    },

    onSignOutSuccess: function () {
      this.interTabOff(EVENTS.SIGNOUT_SUCCESS, this.clearSessionAndNavigateToSignIn);
      this.interTabSend(EVENTS.SIGNOUT_SUCCESS);
      this.clearSessionAndNavigateToSignIn();
    }
  }, InterTabChannelMixin);

  function clearSessionAndNavigateToSignIn () {
    this.logViewEvent(EVENTS.SIGNOUT_SUCCESS);
    this.user.removeAllAccounts();
    this._formPrefill.clear();
    Session.clear();
    this.navigate('signin', {
      success: t('Signed out successfully')
    });
  }
});

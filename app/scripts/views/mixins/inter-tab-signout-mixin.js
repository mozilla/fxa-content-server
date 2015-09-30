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
function (cocktail, constants, session, BaseView, interTabChannelMixin) {
  'use strict';

  var EVENTS = constants.EVENTS;
  var t = BaseView.t;

  return cocktail.mixin({
    afterVisible: function () {
      this.clearSessionAndNavigateToSignin = clearSessionAndNavigateToSignin.bind(this);
      this.interTabOn(EVENTS.SIGNOUT_SUCCESS, this.clearSessionAndNavigateToSignin);
    },

    onSignOutSuccess: function () {
      this.interTabOff(EVENTS.SIGNOUT_SUCCESS, this.clearSessionAndNavigateToSignin);
      this.interTabSend(EVENTS.SIGNOUT_SUCCESS);
      this.clearSessionAndNavigateToSignin();
    }
  }, interTabChannelMixin);

  function clearSessionAndNavigateToSignin () {
    this.logScreenEvent(EVENTS.SIGNOUT_SUCCESS);
    this.user.removeAllAccounts();
    this._formPrefill.clear();
    session.clear();
    this.navigate('signin', {
      success: t('Signed out successfully')
    });
  }
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'tests/functional/lib/helpers',
  'tests/functional/templates/sync_sign_in'
], function (intern, FunctionalHelpers, syncSignInTemplate) {
  var config = intern.config;
  var PAGE_URL = config.fxaContentRoot + 'signin?context=fx_desktop_v1&service=sync';
  var PAGE_URL_WITH_MIGRATION = PAGE_URL + '&migration=sync11';

  var thenify = FunctionalHelpers.thenify;
  var openPage = thenify(FunctionalHelpers.openPage);

  syncSignInTemplate({
    canLinkAccountMessage: 'can_link_account',
    context: 'fx_desktop_v1',
    loginMessage: 'login',
    name: 'Firefox Desktop Sync v1 sign_in',
    useFxAccountsCommands: true
  }, {
    'as a migrating user': function () {
      return this.remote
        .then(openPage(this, PAGE_URL_WITH_MIGRATION, '#fxa-signin-header'))
        .then(FunctionalHelpers.visibleByQSA('.info.nudge'))
        .end();
    }
  });
});

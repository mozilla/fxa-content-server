/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'tests/functional/templates/sync_force_auth'
], function (syncForceAuthTemplate) {

  syncForceAuthTemplate({
    canLinkAccountMessage: 'fxaccounts:can_link_account',
    context: 'fx_fennec_v1',
    loginMessage: 'fxaccounts:login',
    name: 'Fx Fennec Sync v1 force_auth',
    syncPreferencesCommand: 'fxaccounts:sync_preferences',
    useWebChannelCommands: true
  });
});

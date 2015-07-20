/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'lib/session',
  'lib/storage',
  'models/user',
  'component!lib/components/assertion',
  'component!lib/components/config',
  'component!lib/components/fxa-client',
  'component!lib/components/oauth-client',
  'component!lib/components/marketing-email-client',
  'component!lib/components/profile-client',
  'component!lib/components/unique-user-id'
], function (Session, Storage, User, assertion, config, fxaClient, oAuthClient,
             marketingEmailClient, profileClient, uniqueUserId) {
  'use strict';

  function getStorageInstance() {
    return Storage.factory('localStorage', window);
  }

  var user = new User({
      oAuthClientId: config.oAuthClientId,
      profileClient: profileClient,
      oAuthClient: oAuthClient,
      fxaClient: fxaClient,
      marketingEmailClient: marketingEmailClient,
      assertion: assertion,
      storage: getStorageInstance(),
      uniqueUserId: uniqueUserId
    });

  return user.upgradeFromSession(Session, fxaClient).then(function () {
    return user;
  });
});

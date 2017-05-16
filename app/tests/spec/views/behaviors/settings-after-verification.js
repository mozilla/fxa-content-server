/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const SettingsAfterVerificationBehavior = require('views/behaviors/settings-after-verification');

  describe('views/behaviors/settings-after-verification', () => {
    let settingsAfterVerificationBehavior;

    before (() => {
      settingsAfterVerificationBehavior = new SettingsAfterVerificationBehavior();
    });

    it('returns a behavior that navigates to `/settings`', () => {
      assert.equal(settingsAfterVerificationBehavior.type, 'navigate');
      assert.equal(settingsAfterVerificationBehavior.endpoint, 'settings');
    });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Derive relier-specific encryption keys from account master keys.
 */

define(function (require, exports, module) {
  'use strict';

  const requireOnDemand = require('lib/require-on-demand');

  /**
   *
   * Given the account master key kB, generate the matching relier-specific derived
   * scoped key.
   *
   * @param {Object} keys object with properties 'kB' giving the account as hex
   * @param {Object} keyData
   * @returns {Promise} A promise that will resolve with an object having a scoped key.
   *   The key is represented as a JWK object.
   */
  function deriveRelierKeys(keys = {}, keyData = {}) {
    if (! keys.kB) {
      throw new Error('Scoped key: missing kB');
    }

    if (! keyData.keyIdentifier) {
      throw new Error('Scoped key: missing keyIdentifier');
    }

    if (! keyData.keySalt) {
      throw new Error('Scoped key: missing keySalt');
    }

    if (! keyData.keyTimestamp) {
      throw new Error('Scoped key: missing keyTimestamp');
    }

    return requireOnDemand('fxaCryptoDeriver').then((fxaCryptoDeriver) => {
      const scopedKeys = new fxaCryptoDeriver.ScopedKeys();

      return scopedKeys.deriveScopedKeys({
        inputKey: keys.kB,
        scopedKeyIdentifier: keyData.keyIdentifier,
        scopedKeySalt: keyData.keySalt,
        scopedKeyTimestamp: keyData.keyTimestamp
      });
    });
  }

  return {
    deriveRelierKeys: deriveRelierKeys
  };
});

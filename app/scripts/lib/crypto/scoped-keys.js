/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Derive relier-specific encryption keys from account master keys.
 */

define(function (require, exports, module) {
  'use strict';

  const requireOnDemand = require('lib/require-on-demand');
  const p = require('lib/promise');

  /**
   * Given an inputKey, generate the matching relier-specific derived scoped key.
   *
   * @param {Object} inputKey - Key used to derive from
   * @param {Object} keyData - OAuth client data that is required to derive keys
   * @returns {Promise} A promise that will resolve with an object having a scoped key
   *   The key is represented as a JWK object.
   */
  function _deriveScopedKeys(inputKey, keyData = {}) {
    return requireOnDemand('fxaCryptoDeriver').then((fxaCryptoDeriver) => {
      const scopedKeys = new fxaCryptoDeriver.ScopedKeys();

      return scopedKeys.deriveScopedKey({
        identifier: keyData.identifier,
        inputKey: inputKey,
        keyMaterial: keyData.keyMaterial,
        timestamp: keyData.timestamp
      });
    });
  }

  /**
   * Derive scoped keys and create an encrypted bundle for key transport
   *
   * @param {Object} keys - Account keys, used to derive scoped keys
   * @param {Object} clientKeyData - OAuth client data that is required to derive keys
   * @param {Object} keysJwk - Public key used for scoped key encryption
   * @returns {Promise} A promise that will resolve into an encrypted bundle of scoped keys
   */
  function createEncryptedBundle(keys, clientKeyData, keysJwk) {
    const deriveKeys = Object.keys(clientKeyData).map((key) => _deriveScopedKeys(keys.kB, clientKeyData[key]));

    return p.all(deriveKeys)
      .then((derivedKeys) => {
        const bundleObject = {};

        derivedKeys.forEach((derivedKey) => {
          bundleObject[derivedKey.scope] = derivedKey;
        });

        return requireOnDemand('fxaCryptoDeriver').then((fxaCryptoDeriver) => {
          const fxaDeriverUtils = new fxaCryptoDeriver.DeriverUtils();
          const appJwk = fxaCryptoDeriver.jose.util.base64url.decode(JSON.stringify(keysJwk));

          return fxaDeriverUtils.encryptBundle(appJwk, JSON.stringify(bundleObject));
        });
      });
  }

  return {
    createEncryptedBundle,
    _deriveScopedKeys
  };
});

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

    if (! keyData.identifier) {
      throw new Error('Scoped key: missing keyIdentifier');
    }

    if (! keyData.keyMaterial) {
      throw new Error('Scoped key: missing keyMaterial');
    }

    if (! keyData.timestamp) {
      throw new Error('Scoped key: missing keyTimestamp');
    }

    return requireOnDemand('fxaCryptoDeriver').then((fxaCryptoDeriver) => {
      const scopedKeys = new fxaCryptoDeriver.ScopedKeys();

      return scopedKeys.deriveScopedKeys({
        identifier: keyData.identifier,
        inputKey: keys.kB,
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
    const relierKeys = [];
    const clientKeyDataScopes = Object.keys(clientKeyData);

    clientKeyDataScopes.forEach((key) => {
      relierKeys.push(deriveRelierKeys(keys, clientKeyData[key]));
    });

    return p.all(relierKeys)
      .then((derivedKeys) => {
        const scopedKeys = {};

        derivedKeys.forEach((item) => {
          const scopeName = Object.keys(item)[0];
          scopedKeys[scopeName] = item[scopeName];
        });

        return requireOnDemand('fxaCryptoDeriver').then((fxaCryptoDeriver) => {
          const fxaDeriverUtils = new fxaCryptoDeriver.DeriverUtils();
          const appJwk = fxaCryptoDeriver.jose.util.base64url.decode(JSON.stringify(keysJwk));

          return fxaDeriverUtils.encryptBundle(appJwk, JSON.stringify(scopedKeys));
        });
      });
  }

  return {
    createEncryptedBundle: createEncryptedBundle,
    deriveRelierKeys: deriveRelierKeys
  };
});

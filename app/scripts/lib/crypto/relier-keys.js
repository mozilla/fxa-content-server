/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Derive relier-specific encryption keys from account master keys.
 */

'use strict';

define([], function () {
  const scopedKeys = new window.fxaCryptoDeriver.ScopedKeys();

  /**
   * Given the account master keys, the user id and the relier id, generate
   * the matching relier-specific derived class-A and class-B keys.
   *
   * Input arguments:
   *    keys:           object with properties 'kA' and 'kB' giving the account
   *                    keys as hex strings.
   *    keyData:  OAuth client key data required to derive a key.
   *
   * Output:
   *    A promise that will resolve with an object having a scoped key.
   *    The key is represented as a JWK object.
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

    return scopedKeys.deriveScopedKeys({
      inputKey: keys.kB,
      scopedKeyIdentifier: keyData.keyIdentifier,
      scopedKeySalt: keyData.keySalt,
      scopedKeyTimestamp: keyData.keyTimestamp
    });
  }

  return {
    deriveRelierKeys: deriveRelierKeys
  };
});

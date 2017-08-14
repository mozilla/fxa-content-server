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
   *    keys:       object with properties 'kA' and 'kB' giving the account
   *                keys as hex strings.
   *    uid:        string identifying the user who owns the keys.
   *    clientId:   string identifying the relier for whom keys should
   *                be derived.
   *
   * Output:
   *    A promise that will resolve with an object having 'kAr' and 'kBr'
   *    properties, giving relier-specific keys derived from 'kA' and 'kB'
   *    respectively.  Each key is represented as a JWK object.
   */
  function deriveRelierKeys(keys, scopedKeyIdentifier) {
    if (! keys.kB) {
      throw new Error('Cant derive relier keys: missing kB');
    }

    // scopedKeyTimestamp -> comes from the assertion, in the fxageneration....
    // after the login...

    // TODO: deriveScopedKey
    // TODO: server call for the auth'd oauth details
    return scopedKeys.deriveScopedKeys({
      inputKey: keys.kB, // hex
      scopedKeyIdentifier: scopedKeyIdentifier, // string
      scopedKeySalt: '000000000000...', // from the Server //hex
      scopedKeyTimestamp: 1494446722583 // verifierSetAt // int / timestamp
    });
  }

  return {
    deriveRelierKeys: deriveRelierKeys
  };
});

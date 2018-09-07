/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import importFxaCryptoDeriver from './deriver';

/**
 * Encrypt `bundleObject` using `keysJwk`.
 *
 * @export
 * @param {Object} bundleObject
 * @param {Object} keysJwk
 * @returns {String}
 */
export default function encryptBundle (bundleObject, keysJwk) {
  return importFxaCryptoDeriver().then(fxaCryptoDeriver => {
    const fxaDeriverUtils = new fxaCryptoDeriver.DeriverUtils();
    return fxaDeriverUtils.encryptBundle(keysJwk, JSON.stringify(bundleObject));
  });
}

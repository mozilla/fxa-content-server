/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import importFxaCryptoDeriver from './deriver';
import required from '../required';

const HKDF_SHA_256 = 'HKDF-SHA-256';

/**
 * HKDF the Buffer `buf` using `salt` and `info`,
 * generating an output `length` bytes long.
 *
 * @param {Buffer} dataBuffer - data to hash
 * @param {Buffer} saltBuffer - salt
 * @param {Buffer} infoBuffer - info
 * @param {Number} [length=32]
 * @returns {Promise} resolves to hash of `dataBuffer`.
 */
export default (dataBuffer, saltBuffer, infoBuffer, length = 32) => {
  return importFxaCryptoDeriver().then(({jose}) => {
    required(dataBuffer, 'dataBuffer');
    required(saltBuffer, 'saltBuffer');
    required(infoBuffer, 'infoBuffer');

    const options = {
      info: infoBuffer,
      length,
      salt: saltBuffer
    };

    return jose.JWA.derive(HKDF_SHA_256, dataBuffer, options);
  });
};

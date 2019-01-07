/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Converts a hexstr to a Uint8Array
 *
 * @param {String} hexstr
 * @returns {Uint8Array}
 */
function hexToBytes(hexstr) {
  return new Uint8Array(Array.prototype.map.call(hexstr, (c, n) => {
    if (n % 2 === 1) {
      return hexstr[n - 1] + c;
    } else {
      return '';
    }
  }).filter(s => {
    return !! s;
  }).map(s => {
    return parseInt(s, 16);
  }));
}

module.exports = {
  hexToBytes: hexToBytes
};

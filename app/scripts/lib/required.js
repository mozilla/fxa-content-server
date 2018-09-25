/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Throw if the required argument is undefined.
 *
 * @param {Any} arg
 * @param {String} name
 */
export default function required(arg, name) {
  if (typeof arg === 'undefined') {
    throw new Error(`Missing ${name}`);
  }
}


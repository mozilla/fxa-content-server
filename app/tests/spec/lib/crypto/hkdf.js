/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from 'chai';
import hkdf from 'lib/crypto/hkdf';

const DATA_BUFFER = Buffer.from('data', 'utf8');
const SALT_BUFFER = Buffer.from('salt', 'utf8');
const INFO_BUFFER = Buffer.from('info', 'utf8');

describe('lib/crypto/hkdf', () => {
  it('throws if no dataBuffer', () => {
    return hkdf(undefined, SALT_BUFFER, INFO_BUFFER, 32)
      .then(assert.fail, (err) => {
        assert.equal(err.message, 'Missing dataBuffer');
      });
  });

  it('throws if no saltBuffer', () => {
    return hkdf(DATA_BUFFER, undefined, INFO_BUFFER, 32)
      .then(assert.fail, (err) => {
        assert.equal(err.message, 'Missing saltBuffer');
      });
  });

  it('throws if no infoBuffer', () => {
    return hkdf(DATA_BUFFER, SALT_BUFFER, undefined, 32)
      .then(assert.fail, (err) => {
        assert.equal(err.message, 'Missing infoBuffer');
      });
  });

  it('success', () => {
    return hkdf(DATA_BUFFER, SALT_BUFFER, INFO_BUFFER, 32)
      .then((result) => {
        assert.equal(result.length, 32);
      });
  });
});

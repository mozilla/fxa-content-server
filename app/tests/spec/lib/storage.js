/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
  'chai',
  'lib/storage'
],
function (chai, Storage) {
  var assert = chai.assert;

  describe('lib/storage', function () {
    var storage;

    beforeEach(function () {
      storage = new Storage();
    });
    afterEach(function () {
      storage.clear();
    });
    describe('get/set', function () {
      it('can take a key value pair', function () {
        storage.set('key', 'value');
        assert.equal(storage.get('key'), 'value');
      });

      it('can take object values', function () {
        storage.set('key', { foo: 'bar' });
        assert.equal(storage.get('key').foo, 'bar');
      });
    });

    describe('remove', function () {
      it('with a key clears item', function () {
        storage.set('key', 'value');
        storage.remove('key');

        assert.isUndefined(storage.get('key'));
      });
    });

    describe('clear', function () {
      it('clears all items', function () {
        storage.set('key', 'value');
        storage.clear();

        assert.isUndefined(storage.get('key'));
      });
    });
  });
});



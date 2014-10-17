/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
], function () {
  var NAMESPACE = '__fxa_storage';

  function fullKey (key) {
    return NAMESPACE + '.' + key;
  }

  function Storage (backend) {
    this._backend = backend || sessionStorage;
  }

  Storage.prototype.get = function (key) {
    var item = this._backend.getItem(fullKey(key));
    return item ? JSON.parse(item) : undefined;
  };

  Storage.prototype.set = function (key, val) {
    this._backend.setItem(fullKey(key), JSON.stringify(val));
  };

  Storage.prototype.remove = function (key) {
    this._backend.removeItem(fullKey(key));
  };

  Storage.prototype.clear = function () {
    this._backend.clear();
  };

  return Storage;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function () {
  'use strict';

  function StorageMock (options) {
    options = options || {};

    this.isSessionStorageEnabled = function () {
      return options.isSessionStorageEnabled;
    };

    this.isLocalStorageEnabled = function () {
      return options.isLocalStorageEnabled;
    };
  }

  return StorageMock;
});

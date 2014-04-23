/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// An error that is not displayed to the user.

'use strict';

define([
], function () {
  function SilentError(msg) {
    this.message = msg;
    Error.apply(this, arguments);
  }

  SilentError.prototype = new Error();

  return SilentError;
});


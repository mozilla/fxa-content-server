/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require([
  './require_config'
],
function () {
  'use strict';

  // Ensure config is loaded before trying to load any other scripts.
  require([
    // promise is loaded to polyfill window.Promise on browsers w/o support.
    'lib/promise',
    './lib/app-start'
  ], (p, AppStart) => {
    var appStart = new AppStart();
    appStart.startApp();
  });

});

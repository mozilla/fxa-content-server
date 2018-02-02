/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AppStart from './lib/app-start';
window.$ = require('jquery'); // expose jQuery for functional and manual tests
const appStart = new AppStart();
appStart.startApp();

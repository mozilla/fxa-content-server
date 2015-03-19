/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// allow users to sign up for a newsletter

'use strict';

module.exports = function (options) {
  return {
    method: 'post',
    path: '/newsletter',
    process: function (req, res) {
      // don't wait around to send a response.
      res.json({ success: true });

      // not much to do yet. Not sure where this is going to go.
    }
  };
};

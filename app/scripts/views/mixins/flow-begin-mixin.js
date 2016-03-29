/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Tells the server to emit the `flow.begin` activity event.

define(function (require, exports, module) {
  'use strict';

  var $ = require('jquery');

  var ELEMENT_NAME = 'body';
  var ATTRIBUTE_NAME = 'data-flow-begin';

  module.exports = {
    afterRender: function () {
      var flowBeginTime = parseInt($(ELEMENT_NAME).attr(ATTRIBUTE_NAME), 10);

      this.user.beginFlow(flowBeginTime);

      this.user.on('end-flow', function () {
        // Clean up the DOM after the flow has ended to ensure
        // that future flow.begin events have the correct time.
        $(ELEMENT_NAME).removeAttr(ATTRIBUTE_NAME);
      });
    }
  };
});

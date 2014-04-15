/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// A progress indicator. Shows an animated bar across the top of the
// screen. Multiple calls to `start` can be made, progress bar is
// only hidden after an equal number of calls to `done` are made.

define([
  'nprogress'
], function (nProgress) {
  'use strict';

  nProgress.configure({
    showSpinner: false
  });

  // `count` ensures the progress bar is only hidden if all calls to `start`
  // have a matching call to `done`. This smooths out screen transitions
  return {
    _count: 0,

    /**
     * Show the progress indicator. No visual effect if progress
     * bar is already shown
     *
     * @method start
     */
    start: function () {
      if (! this._count) {
        nProgress.start();
      }

      this._count++;
    },

    /**
     * Hide the progress indicator if an equal number of calls to
     * `start` and `done` have been made.
     *
     * @method done
     */
    done: function () {
      if (this._count > 0) {
        this._count--;
      }

      if (! this._count) {
        nProgress.done();
      }
    },

    /**
     * Is the progress bar visible?
     */
    isVisible: function () {
      return !!this._count;
    },

    testReset: function () {
      this._count = 0;
    }
  };
});


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A mixin that only allows one of the given type to be visible
 * at a time. Useful for things like tooltips where only
 * one should be visible at a time.
 */

const visibleViews = {};

/**
 * Create the mixin.
 *
 * @export
 * @param {Object} options
 * @param {String|Function} options.action - action to call to hide the view.
 *   If a string, this[action]() will be called, if a function, the function
 *   will be called with the current view as the context.
 * @param {String} options.trigger - name of the method that
 *   causes visible views to be hidden.
 * @param {String} options.type - namespace. Only one item per namespace
 *   can be visible at a time.
 * @returns {Function}
 */
export default function (options) {
  const { action, trigger, type } = options;
  return {
    beforeDestroy () {
      // The current view can no longer be active after being destroyed
      const entry = visibleViews[type];
      if (entry && entry.view === this) {
        visibleViews[type] = null;
        delete visibleViews[type];
      }
    },

    // wrap the triggering function so that
    // housekeeping is automatic.
    [trigger] () {
      const entry = visibleViews[type];
      if (entry && entry.view !== this) {
        if (typeof entry.action === 'function') {
          entry.action.call(entry.view);
        } else if (typeof entry.action === 'string') {
          entry.view[entry.action]();
        }
      }

      visibleViews[type] = {
        action,
        view: this
      };
    }
  };
}

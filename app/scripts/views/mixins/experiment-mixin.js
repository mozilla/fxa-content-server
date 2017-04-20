/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const ExperimentInterface = require('lib/experiment');

  module.exports = {
    initialize (options = {}) {
      this.experiments = options.experiments || new ExperimentInterface({
        able: options.able,
        account: this._account,
        metrics: this.metrics,
        notifier: options.notifier,
        translator: this.translator,
        user: options.user,
        window: this.window
      });

      this.experiments.chooseExperiments();
    },

    /**
     * Destroy the attached experiments instance.
     */
    destroy () {
      if (this.experiments) {
        this.experiments.destroy();
        this.experiments = null;
      }
    }
  };

  // Create some delegate methods.
  [
    'createExperiment',
    'getExperimentGroup',
    'isInExperiment',
    'isInExperimentGroup'
  ].forEach((methodName) => {
    module.exports[methodName] = function (...args) {
      return this.experiments[methodName](...args);
    };
  });
});

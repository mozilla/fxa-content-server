/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = function (grunt) {
  const webpackConfig = require('../webpack.config.babel');

  grunt.config('webpack', {
    options: {
      stats: ! process.env.NODE_ENV || process.env.NODE_ENV === 'development'
    },
    prod: webpackConfig,
    dev: Object.assign({ watch: true }, webpackConfig)
  });
};


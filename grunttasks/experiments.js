/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  var PACKAGE_JSON = '../package.json';

  /**
   *
   */
  grunt.registerTask('experiments', 'Updates experiment configuration for train deploys', function () {
    var fs = require('fs');
    var semverUtils = require('semver-utils');
    var lib = require('./lib/experiments');

    var version = require(PACKAGE_JSON).version;
    var semver = semverUtils.parse(version);

    var newBranchName = 'train-' + semver.minor;

    lib.bumpExperimentBranch(newBranchName);
    lib.generateNewConfig(newBranchName);
  });
};

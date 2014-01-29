/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.config('requirejs', {
    dist: {
      // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
      options: {
        almond: true,
        replaceRequireScript: [{
          files: ['<%= yeoman.dist %>/index.html'],
          module: 'main'
        }],
        modules: [{name: 'main'}],
        mainConfigFile: '<%= yeoman.app %>/scripts/main.js',
        dir: '<%= yeoman.dist %>/scripts',
        baseUrl: '<%= yeoman.app %>/scripts',
        useStrict: true,
        stubModules: ['text', 'stache'],
        optimize: 'none',
        wrap: true
      }
    }
  });
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  var config = require('../server/lib/configuration');

  grunt.config('replace', {
    tos_pp: {
      src: [
        '<%= yeoman.pp_md_src %>/*.md',
        '<%= yeoman.tos_md_src %>/*.md'
      ],
      overwrite: true,
      replacements: [{
        from: /{:\s.*?\s}/g,
        to: ''
      }, {
        from: /^#\s.*?\n$/m,
        to: ''
      }]
    },
    'include.js': {
      src: [
        '<%= yeoman.app %>/include.js.template'
      ],
      dest: '<%= yeoman.app %>/include.js',
      replacements: [{
        from: '{{fxa_host}}',
        to: config.get('public_url')
      }]
    }
  });
};

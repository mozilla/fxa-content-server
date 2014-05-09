/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// task to take care of generating connect-fonts CSS and copying font files.

module.exports = function (grunt) {
  'use strict';

  var config = require('../server/lib/configuration');

  var fontPacks = [
    'connect-fonts-clearsans',
    'connect-fonts-firasans'
  ];

  grunt.config('connect_fonts', {
    dist: {
      options: {
        fontPacks: fontPacks,
        fontNames: [
          'clearsans-regular',
          'firasans-regular',
          'firasans-light'
        ],
        languages: config.get('i18n.supportedLanguages'),
        dest: '<%= yeoman.tmp %>/styles'
      }
    }
  });

  grunt.config('connect_fonts_copy', {
    dist: {
      options: {
        fontPacks: fontPacks,
        dest: '<%= yeoman.tmp %>/fonts'
      }
    }
  });
};

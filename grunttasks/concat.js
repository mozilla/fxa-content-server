/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


module.exports = function (grunt) {
  'use strict';

  var config = require('../server/lib/configuration');
  var supportedLanguages = config.get('i18n.supportedLanguages');

  var destFiles = {};

  // create one entry per supported in the destination files.
  // The destination file will be called <locale_name>.css.
  supportedLanguages.forEach(function (language) {
    destFiles['<%= yeoman.app %>/styles/localized/' + language + '.css'] = [
      '<%= yeoman.tmp %>/styles/' + language + '.css',
      '<%= yeoman.app %>/bower_components/normalize-css/normalize.css',
      '<%= yeoman.app %>/styles/main.css'
    ];
  });

  grunt.config('concat', {
    css: {
      files: destFiles
    }
  });
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  grunt.config('babel', {
    options: {
      sourceMap: true
    },
    scripts: {
      files: [{
        expand: true,
        cwd: 'app/scripts',
        dest: 'app/scripts-built/',
        src: [
          '**/*.js',
          '!vendor/**/*.js'
         ]
      }]
    }
  });

  grunt.event.on('watch', function (action, filepath, target) {
    if (target === 'babel') {
      var files = grunt.config('babel.scripts.files');
      // pwd is already app/scripts, remove the prefix or else
      // no compilation occurs.
      filepath = filepath.replace('app/scripts/', '');
      files[0].src = [filepath];
      grunt.config('babel.scripts.files', files);
    }
  });
};


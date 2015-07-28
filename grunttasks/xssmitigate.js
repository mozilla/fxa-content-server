/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var xss = require('xss');

module.exports = function (grunt) {
  grunt.registerTask('xss-flag', 'Run the XSS parser on the generated l10n files', [
    'clean',
    'selectconfig:dist',
    'l10n-generate-pages',
    'l10n-json-to-html',
    'xss-parse'
    ]
  );

  grunt.registerMultiTask('xss-parse', 'Parse HTML files to check for XSS vectors', function () {
    var templateRegex = /\%\(\w+\)s/;
    var hasErrors = 0;
    this.files.forEach(function (file) {
      // iterate through each HTML file in the .tmp folder
      var src = file.src[0];
      var contents = grunt.file.read(src);
      var errorFound = false;
      // whitelist of allowed tags and attributes, nothing else is allowed
      var options = {
        whiteList: {
          a: ['href', 'id'],
          em: [],
          span: ['id', 'tabindex'],
          strong: []
        },
        onTagAttr: function (tag, name, value, isWhiteAttr) {
          // On encountering any tag, check if the tag has a valid attribute.
          // If the attribute is valid, check for its value, flag if illegal
          // Illegal includes any mention of the string 'javascript', case insensitive
          // Templated strings are allowed i.e strings of the form '%(termsURI)s'
          // If these are considered to be not secure, we should change
          if (isWhiteAttr && xss.safeAttrValue(tag, name, value) === '' && ! templateRegex.test(value)) {
            grunt.log.error('%s: INVALID VALUE FOR ATTRIBUTE <%s %s="%s">', src, tag, name, value);
            hasErrors += 1;
            errorFound = true;
            return '';
          }
        },
        onIgnoreTag: function (tag, html, options) {
          // On encountering any illegal tag, flag it
          grunt.log.error('%s: INVALID TAGS found <%s>', src, tag);
          hasErrors += 1;
          errorFound = true;
          return '';
        },
        onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
          // On encountering any illegal attribute, flag it
          grunt.log.error('%s: INVALID TAG ATTRIBUTES FOUND <%s %s="">', src, tag, name);
          hasErrors += 1;
          errorFound = true;
          return '';
        }
      };
      contents = xss(contents, options);
      if (errorFound) {
        // if an error was found in this file, write it back out.
        grunt.file.write(src, contents);
      }
    });
    if (hasErrors !== 0) {
      grunt.fail.warn('Found ' + hasErrors + ' ' + grunt.util.pluralize(hasErrors, 'error/errors') + ' in ' + this.files.length + ' files');
    } else {
      grunt.log.writeln('Checked ' + this.files.length + ' files for XSS vulnerabilities');
    }
  });

  grunt.config('xss-parse', {
    dist: {
      files: [
        {
          expand: true,
          src: [
            '<%= yeoman.tmp %>/i18n/*/*.html'
          ]
        }
      ]
    }
  });
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.config('htmllint', {
    options: {
      ignore: [
        'Bad value “X-UA-Compatible” for attribute “http-equiv” on XHTML element “meta”.',
        'Duplicate ID “-”.',
        'Text run is not in Unicode Normalization Form C.',
        'The first occurrence of ID “-” was here.'
      ]
    },

    all: [
      '<%= yeoman.app %>/**/*.{html,mustache}',
      '!<%= yeoman.app %>/bower_components/**',
      '<%= yeoman.page_template_dist %>/**/*.html',
      '!<%= yeoman.page_template_dist %>/it_CH/*.html',
      '!<%= yeoman.page_template_dist %>/{privacy,terms}/*.html'
    ],

    en_US: [
      '<%= yeoman.app %>/**/*.{html,mustache}',
      '!<%= yeoman.app %>/bower_components/**',
      '<%= yeoman.page_template_dist %>/en_US/*.html'
    ]
  });
};

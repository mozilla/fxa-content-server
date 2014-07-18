/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Allow the user to take a survey.

define([
  'views/snippets/snippet',
  'stache!templates/snippets/survey'
], function (SnippetView, Template) {
  'use strict';

  var View = SnippetView.extend({
    template: Template
  });

  return View;
});



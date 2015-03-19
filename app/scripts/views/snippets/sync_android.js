/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Sync for android snippet

define([
  'views/snippets/snippet',
  'stache!templates/snippets/sync_android'
], function (SnippetView, Template) {
  'use strict';

  var View = SnippetView.extend({
    template: Template
  });

  return View;
});



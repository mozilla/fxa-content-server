/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A view to fetch and render legal copy. Sub-classes must provide
 * a `copyUrl` where the copy template can be fetched, as well a
 * `fetchError`, which is an error to display if there is a
 * problem fetching the copy template.
 */

define(function (require, exports, module) {
  'use strict';

  const BaseView = require('./base');
  const Cocktail = require('cocktail');

  const View = BaseView.extend({
    beforeRender () {
      const action = this.relier.get('action');
      this.replaceCurrentPage(action);
    }
  });

  Cocktail.mixin(
    View,
  );

  module.exports = View;
});


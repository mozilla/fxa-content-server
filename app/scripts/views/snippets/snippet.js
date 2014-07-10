/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Allow the user to sign up for the newsletter.

define([
  'views/base'
], function (BaseView) {
  'use strict';

  var View = BaseView.extend({
    events: {
      'click .marketing-link': '_logMarketingClick'
    },

    afterRender: function () {
      var marketingType = this.$('[data-marketing-type]').attr('data-marketing-type');
      var marketingLink = this.$('.marketing-link').attr('href');


      this.metrics.logMarketingImpression(marketingType, marketingLink);
    },

    _logMarketingClick: function () {
      this.metrics.logMarketingClick();
    }
  });

  return View;
});



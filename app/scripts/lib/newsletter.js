/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// module to sign up for the newsletter.

define([
  'jquery',
  'p-promise'
], function ($, p) {
  'use strict';

  return {
    signUp: function (email) {
      var defer = p.defer();

      $.ajax('/newsletter', {
        type: 'POST',
        data: {
          email: email
        }
      })
      .then(function (data, textStatus, jqXHR) {
        defer.resolve(data);
      }, function (jqXHR, textStatus, errorThrown) {
        defer.reject(errorThrown);
      });

      return defer.promise;
    }
  };
});



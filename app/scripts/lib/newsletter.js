/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// module to sign up for the newsletter.

define([
  'lib/xhr'
], function (xhr) {
  'use strict';

  function NewsletterClient() {
    // nothing to do here.
  }

  NewsletterClient.prototype = {
    signUp: function (email) {
      return xhr.ajax('/newsletter', {
        type: 'POST',
        data: {
          email: email
        }
      });
    }
  };

  return NewsletterClient;
});



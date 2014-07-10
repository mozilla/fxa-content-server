/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'sinon',
  'views/snippets/newsletter_optin',
  '../../../lib/helpers'
],
function (chai, sinon, Snippet, TestHelpers) {
  'use strict';

  var assert = chai.assert;

  describe('views/snippets/newsletter_optin', function () {
    var view, xhr, requests;

    beforeEach(function () {
      requests = [];
      xhr = sinon.useFakeXMLHttpRequest();
      xhr.onCreate = function (xhr) {
        requests.push(xhr);
      };

      view = new Snippet({
        el: $('#container'),
        successMessageMS: 0
      });

      return view.render();
    });

    afterEach(function () {
      xhr.restore();

      view.destroy();
      view = null;
    });

    describe('signup click success', function () {
      it('shows a success message', function (done) {
        view.$('#newsletter-optin').click();

        view.on('success', function (message) {
          TestHelpers.wrapAssertion(function () {
            assert.ok(message);
          }, done);
        });

        requests[0].respond(200, { 'Content-Type': 'application/json' },
                                '{"success":true}');
      });
    });

    describe('signup click failure', function () {
      it('shows an error message', function (done) {
        view.$('#newsletter-optin').click();

        view.on('error', function (message) {
          TestHelpers.wrapAssertion(function () {
            assert.ok(message);
          }, done);
        });

        requests[0].respond(500, { 'Content-Type': 'application/json' },
                                '{"reason":"invalid email"}');
      });
    });
  });
});

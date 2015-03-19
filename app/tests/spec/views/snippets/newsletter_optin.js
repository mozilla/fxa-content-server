/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'sinon',
  'views/snippets/newsletter_optin',
  'lib/newsletter',
  'lib/promise',
  'models/user',
  '../../../lib/helpers'
],
function (chai, sinon, Snippet, NewsletterClient, p, User, TestHelpers) {
  'use strict';

  var assert = chai.assert;

  describe('views/snippets/newsletter_optin', function () {
    var view;
    var newsletterClient;
    var user;

    beforeEach(function () {
      newsletterClient = new NewsletterClient();
      user = new User();
      user.setSignedInAccount({
        email: 'testuser@testuser.com'
      });

      view = new Snippet({
        el: $('#container'),
        successMessageMS: 0,
        newsletterClient: newsletterClient,
        user: user
      });

      return view.render();
    });

    afterEach(function () {
      view.destroy();
      view = null;
    });

    describe('signup click success', function () {
      it('shows a success message', function (done) {
        sinon.stub(newsletterClient, 'signUp', function () {
          return p(true);
        });

        view.$('#newsletter-optin').click();

        view.on('success', function (message) {
          TestHelpers.wrapAssertion(function () {
            assert.ok(message);
          }, done);
        });
      });
    });

    describe('signup click failure', function () {
      it('shows an error message', function (done) {
        sinon.stub(newsletterClient, 'signUp', function () {
          return p.reject('invalid email');
        });
        view.$('#newsletter-optin').click();

        view.on('error', function (message) {
          TestHelpers.wrapAssertion(function () {
            assert.ok(message);
          }, done);
        });
      });
    });
  });
});

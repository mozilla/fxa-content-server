/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'jquery',
  'sinon',
  'views/settings/avatar',
  '../../../mocks/router',
  '../../../mocks/fxa-client',
  'lib/promise',
  'lib/auth-errors',
  'lib/translator',
  'models/reliers/relier',
  'models/user'
],
function (chai, $, sinon, View, RouterMock, FxaClientMock,
    p, AuthErrors, Translator, Relier, User) {
  'use strict';

  var assert = chai.assert;
  var IMG_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQYV2P4DwABAQEAWk1v8QAAAABJRU5ErkJggg==';

  describe('views/settings/avatar', function () {
    var view;
    var routerMock;
    var fxaClientMock;
    var relierMock;
    var user;
    var account;
    var translator;

    beforeEach(function () {
      routerMock = new RouterMock();
      fxaClientMock = new FxaClientMock();
      relierMock = new Relier();
      user = new User();
      translator = new Translator();

      view = new View({
        router: routerMock,
        translator: translator,
        user: user,
        fxaClient: fxaClientMock,
        relier: relierMock
      });
    });

    afterEach(function () {
      $(view.el).remove();
      view.destroy();
      view = null;
      routerMock = null;
      fxaClientMock = null;
    });

    describe('with no session', function () {
      it('redirects to signin', function () {
        return view.render()
          .then(function () {
            assert.equal(routerMock.page, 'signin');
          });
      });
    });

    describe('with session', function () {

      beforeEach(function () {
        view.isUserAuthorized = function () {
          return p(true);
        };
        account = user.initAccount({
          email: 'a@a.com',
          accessToken: 'abc123',
          verified: true
        });

        sinon.stub(view, 'getSignedInAccount', function () {
          return account;
        });
      });

      it('has no avatar set', function () {
        sinon.stub(account, 'getAvatar', function () {
          return p({});
        });

        return view.render()
          .then(function () {
            return view.afterVisible();
          })
          .then(function () {
            assert.equal(view.$('.avatar-wrapper img').length, 0);
          });
      });

      it('avatar fetch fails', function () {
        sinon.stub(account, 'getAvatar', function () {
          return p.reject(AuthErrors.toError('UNEXPECTED_ERROR'));
        });

        return view.render()
          .then(function () {
            return view.afterVisible();
          })
          .then(function () {
            assert.equal(view.$('.avatar-wrapper img').length, 0);
          });
      });

      it('has an avatar set', function () {
        sinon.stub(account, 'getAvatar', function () {
          return p({ avatar: IMG_URL, id: 'bar' });
        });

        return view.render()
          .then(function () {
            return view.afterVisible();
          })
          .then(function () {
            assert.equal(view.$('.avatar-wrapper img').attr('src'), IMG_URL);
          });
      });

    });
  });
});

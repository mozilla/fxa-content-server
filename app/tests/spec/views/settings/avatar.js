/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function(require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var AuthErrors = require('lib/auth-errors');
  var chai = require('chai');
  var FxaClientMock = require('../../../mocks/fxa-client');
  var p = require('lib/promise');
  var Relier = require('models/reliers/relier');
  var RouterMock = require('../../../mocks/router');
  var sinon = require('sinon');
  var User = require('models/user');
  var View = require('views/settings/avatar');

  var assert = chai.assert;
  var IMG_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQYV2P4DwABAQEAWk1v8QAAAABJRU5ErkJggg==';

  describe('views/settings/avatar', function () {
    var view;
    var routerMock;
    var fxaClientMock;
    var relierMock;
    var user;
    var account;

    beforeEach(function () {
      routerMock = new RouterMock();
      fxaClientMock = new FxaClientMock();
      relierMock = new Relier();
      user = new User();

      view = new View({
        router: routerMock,
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

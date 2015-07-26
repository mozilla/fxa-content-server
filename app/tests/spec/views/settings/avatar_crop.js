/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function(require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var AuthBroker = require('models/auth_brokers/base');
  var AuthErrors = require('lib/auth-errors');
  var chai = require('chai');
  var CropperImage = require('models/cropper-image');
  var EphemeralMessages = require('lib/ephemeral-messages');
  var jQuerySimulate = require('jquery-simulate'); //eslint-disable-line no-unused-vars
  var Metrics = require('lib/metrics');
  var p = require('lib/promise');
  var ProfileMock = require('../../../mocks/profile');
  var Relier = require('models/reliers/relier');
  var RouterMock = require('../../../mocks/router');
  var sinon = require('sinon');
  var TestHelpers = require('../../../lib/helpers');
  var ui = require('draggable'); //eslint-disable-line no-unused-vars
  var User = require('models/user');
  var View = require('views/settings/avatar_crop');

  var assert = chai.assert;
  var pngSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAACZJREFUeNrtwQEBAAAAgiD' +
               '/r25IQAEAAAAAAAAAAAAAAAAAAADvBkCAAAEehacTAAAAAElFTkSuQmCC';

  describe('views/settings/avatar/crop', function () {
    var view;
    var routerMock;
    var profileClientMock;
    var ephemeralMessages;
    var user;
    var account;
    var relier;
    var broker;
    var metrics;

    beforeEach(function () {
      routerMock = new RouterMock();
      metrics = new Metrics();
      user = new User();
      ephemeralMessages = new EphemeralMessages();
      relier = new Relier();
      broker = new AuthBroker({
        relier: relier
      });

      view = new View({
        user: user,
        ephemeralMessages: ephemeralMessages,
        router: routerMock,
        relier: relier,
        broker: broker
      });
    });

    afterEach(function () {
      $(view.el).remove();
      view.destroy();
      metrics.destroy();
      view = null;
      routerMock = null;
      profileClientMock = null;
      metrics = null;
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

      it('has no cropper image', function () {
        return view.render()
          .then(function () {
            assert.equal(routerMock.page, 'settings/avatar/change');
            assert.equal(ephemeralMessages.get('error'), AuthErrors.toMessage('UNUSABLE_IMAGE'));
          });
      });

      describe('with an image', function () {

        beforeEach(function () {
          var cropImg = new CropperImage({
            src: pngSrc,
            type: 'image/png',
            width: 100,
            height: 100
          });

          profileClientMock = new ProfileMock();
          ephemeralMessages.set('data', {
            cropImg: cropImg
          });

          view = new View({
            router: routerMock,
            ephemeralMessages: ephemeralMessages,
            user: user,
            relier: relier,
            metrics: metrics,
            screenName: 'settings.avatar.crop'
          });
          view.isUserAuthorized = function () {
            return p(true);
          };
          sinon.stub(view, 'getSignedInAccount', function () {
            return account;
          });
          sinon.stub(account, 'profileClient', function () {
            return p(profileClientMock);
          });
          sinon.stub(view, 'updateProfileImage', function () {
            return p();
          });
        });

        it('has a cropper image', function () {
          return view.render()
            .then(function (rendered) {
              assert.isTrue(rendered);

              view.afterVisible();

              assert.equal(view.$('.cropper img').attr('src'), pngSrc);
            });
        });

        it('submits an image', function () {
          sinon.stub(profileClientMock, 'uploadAvatar', function () {
            return p({
              url: 'test',
              id: 'foo'
            });
          });

          return view.render()
            .then(function () {
              return view.afterVisible();
            })
            .then(function () {
              return view.submit();
            })
            .then(function (result) {
              assert.equal(view.updateProfileImage.args[0][0].get('url'), result.url);
              assert.equal(result.url, 'test');
              assert.equal(result.id, 'foo');
              assert.equal(routerMock.page, 'settings');
            });
        });

        it('logs a metric event on rotation', function () {
          return view.render()
            .then(function () {
              return view.afterVisible();
            })
            .then(function () {
              view.$('.controls > .rotate').click();
              assert.isTrue(TestHelpers.isEventLogged(metrics,
                'settings.avatar.crop.rotate.cw'));
            });
        });

        it('logs a metric event on translation', function () {
          return view.render()
            .then(function () {
              return view.afterVisible();
            })
            .then(function () {
              view.$('.cropper .ui-draggable').simulate('drag', { dx: 50, dy: 50 });
              assert.isTrue(TestHelpers.isEventLogged(metrics,
                'settings.avatar.crop.translate'));
            });
        });

        it('logs a metric event on zoom in', function () {
          return view.render()
            .then(function () {
              return view.afterVisible();
            })
            .then(function () {
              view.$('.controls > .zoom-in').click();
              assert.isTrue(TestHelpers.isEventLogged(metrics,
                'settings.avatar.crop.zoom.in'));
            });
        });

        it('logs a metric event on zoom out', function () {
          return view.render()
            .then(function () {
              return view.afterVisible();
            })
            .then(function () {
              view.$('.controls > .zoom-out').click();
              assert.isTrue(TestHelpers.isEventLogged(metrics,
                'settings.avatar.crop.zoom.out'));
            });
        });

        it('logs a metric event on zoom range change', function () {
          return view.render()
            .then(function () {
              return view.afterVisible();
            })
            .then(function () {
              view.$('.controls > .slider').change();
              assert.isTrue(TestHelpers.isEventLogged(metrics,
                'settings.avatar.crop.zoom.range'));
            });
        });
      });
    });
  });
});

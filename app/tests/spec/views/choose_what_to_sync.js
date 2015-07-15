/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
    'chai',
    'jquery',
    'sinon',
    'lib/promise',
    'views/choose_what_to_sync',
    'lib/metrics',
    'lib/fxa-client',
    'lib/ephemeral-messages',
    'models/user',
    'models/auth_brokers/base',
    '../../mocks/window',
    '../../mocks/router',
    '../../lib/helpers'
  ],
  function (chai, $, sinon, p, View, Metrics, FxaClient, EphemeralMessages,
            User, Broker, WindowMock, RouterMock, TestHelpers) {
    'use strict';

    var assert = chai.assert;

    describe('views/choose_what_to_sync', function () {
      var view;
      var routerMock;
      var metrics;
      var windowMock;
      var fxaClient;
      var broker;
      var user;
      var email;
      var ephemeralMessages;
      var account;

      beforeEach(function () {
        email = TestHelpers.createEmail();
        routerMock = new RouterMock();
        windowMock = new WindowMock();
        metrics = new Metrics();
        broker = new Broker();
        fxaClient = new FxaClient();
        user = new User({
          fxaClient: fxaClient
        });

        ephemeralMessages = new EphemeralMessages();
        account = user.initAccount({
          email: email,
          uid: 'uid',
          sessionToken: 'fake session token'
        });
        ephemeralMessages.set('data', {
          account: account
        });
      });

      afterEach(function () {
        metrics.destroy();
        view.remove();
        view.destroy();
        view = metrics = null;
      });

      function initView () {
        view = new View({
          router: routerMock,
          metrics: metrics,
          window: windowMock,
          fxaClient: fxaClient,
          user: user,
          broker: broker,
          // TODO: underscores in screenName?
          screenName: 'choose_what_to_sync',
          ephemeralMessages: ephemeralMessages
        });

        return view.render()
          .then(function () {
            $('#container').html(view.el);
          });
      }

      describe('renders', function () {
        it('coming from sign up, redirects to /signup when email accound data missing', function () {
          account.clear('email');
          return initView()
            .then(function () {
              assert.equal(routerMock.page, 'signup');
            });
        });

        it('renders email info', function () {
          return initView()
            .then(function () {
              assert.include(view.$('#fxa-choose-what-to-sync-email').text(), email,
                'email is in the view');
            });
        });
      });

      describe('_getDeclinedEngines', function () {
        it('returns an array of declined engines', function () {
          return initView()
            .then(function () {
              //decline the first engine
              $('.customize-sync').first().click();
              var declined = view._getDeclinedEngines();
              assert.equal(declined.length, 1, 'has declined engines');
              assert.equal(declined[0], 'bookmarks', 'has engine value');
            });
        });

      });

      describe('submit', function () {
        beforeEach(function () {
          sinon.spy(user, 'setAccount');
        });

        it('coming from sign up, redirects unverified users to the confirm page on success', function () {
          return initView()
            .then(function () {
              sinon.spy(view, 'navigate');
              $('.customize-sync').first().click();

              return view.submit()
                .then(function () {
                  var declined = account.get('declinedSyncEngines');
                  assert.equal(declined.length, 1, 'has declined engines');
                  assert.equal(declined[0], 'bookmarks', 'has engine value');
                  assert.isTrue(account.get('customizeSync'), 'sync customization is on');
                  assert.isTrue(TestHelpers.isEventLogged(metrics, 'choose_what_to_sync.engine_unchecked.bookmarks'), 'tracks unchecked');
                  assert.isTrue(TestHelpers.isEventLogged(metrics, 'choose_what_to_sync.submit'), 'tracks success');
                  assert.isTrue(user.setAccount.calledWith(account), 'user called with account');
                  assert.isTrue(view.navigate.calledWith('confirm', {
                    data: { account: account }
                  }), 'navigates to confirm');
                });
            });
        });

        it('notifies the broker when a pre-verified user signs up', function () {
          sinon.stub(broker, 'afterSignIn', function () {
            return p();
          });

          return initView()
            .then(function () {
              account.set('verified', true);

              return view.submit()
                .then(function () {
                  assert.isTrue(user.setAccount.calledWith(account));
                  assert.isTrue(broker.afterSignIn.calledWith(account));
                  assert.equal(routerMock.page, 'signup_complete');
                });
            });
        });

      });

    });
  });

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'sinon',
  'lib/promise',
  'lib/auth-errors',
  'views/confirm_reset_password',
  'lib/metrics',
  'lib/ephemeral-messages',
  'lib/channels/inter-tab',
  'lib/storage',
  '../../mocks/fxa-client',
  'models/reliers/relier',
  'models/auth_brokers/base',
  'models/user',
  '../../mocks/router',
  '../../mocks/window',
  '../../lib/helpers'
],
function (chai, sinon, p, AuthErrors, View, Metrics, EphemeralMessages,
      InterTabChannel, Storage, FxaClient, Relier, Broker, User,
      RouterMock, WindowMock, TestHelpers) {
  'use strict';

  var assert = chai.assert;

  describe('views/confirm_reset_password', function () {
    var EMAIL = 'testuser@testuser.com';
    var PASSWORD_FORGOT_TOKEN = 'fake password reset token';
    var view;
    var routerMock;
    var windowMock;
    var metrics;
    var fxaClient;
    var relier;
    var broker;
    var interTabChannel;
    var ephemeralMessages;
    var user;

    var LOGIN_MESSAGE_TIMEOUT_MS = 300;
    var VERIFICATION_POLL_TIMEOUT_MS = 100;

    function createDeps() {
      destroyView();

      routerMock = new RouterMock();
      windowMock = new WindowMock();

      sinon.stub(windowMock, 'setTimeout', window.setTimeout.bind(window));
      sinon.stub(windowMock, 'clearTimeout', window.clearTimeout.bind(window));

      metrics = new Metrics();
      relier = new Relier();
      broker = new Broker({
        relier: relier
      });
      fxaClient = new FxaClient();
      interTabChannel = new InterTabChannel();
      ephemeralMessages = new EphemeralMessages();
      user = new User({
        storage: Storage.factory('localStorage')
      });

      sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
        return p(true);
      });

      ephemeralMessages.set('data', {
        email: EMAIL,
        passwordForgotToken: PASSWORD_FORGOT_TOKEN
      });

      createView();
    }

    function createView () {
      view = new View({
        router: routerMock,
        window: windowMock,
        metrics: metrics,
        fxaClient: fxaClient,
        relier: relier,
        broker: broker,
        user: user,
        interTabChannel: interTabChannel,
        loginMessageTimeoutMS: LOGIN_MESSAGE_TIMEOUT_MS,
        verificationPollMS: VERIFICATION_POLL_TIMEOUT_MS,
        ephemeralMessages: ephemeralMessages,
        screenName: 'confirm_reset_password'
      });
    }

    function destroyView () {
      if (view) {
        view.remove();
        view.destroy();
        view = null;
      }
    }

    afterEach(function () {
      metrics.destroy();
      metrics = null;

      destroyView();
    });

    describe('render', function () {
      beforeEach(function () {
        createDeps();

        return view.render()
          .then(function () {
            $('#container').html(view.el);
          });
      });

      afterEach(function () {
        destroyView();
      });

      it('tells the broker to prepare for a password reset confirmation', function () {
        sinon.spy(broker, 'persist');
        return view.render()
          .then(function () {
            assert.isTrue(broker.persist.called);
          });
      });

      it('redirects to /reset_password if no passwordForgotToken', function () {
        ephemeralMessages.set('data', {
          email: EMAIL
        });

        createView();

        sinon.spy(view, 'navigate');

        return view.render()
          .then(function () {
            assert.isTrue(view.navigate.calledWith('reset_password'));
          });
      });

      it('`sign in` link goes to /signin in normal flow', function () {
        return view.render()
          .then(function () {
            // Check to make sure the normal signin link is drawn
            assert.equal(view.$('a[href="/signin"]').length, 1);
            assert.equal(view.$('a[href="/force_auth?email=testuser%40testuser.com"]').length, 0);
            assert.ok($('#fxa-confirm-reset-password-header').length);
          });
      });

      it('`sign in` link goes to /force_auth in force auth flow', function () {
        sinon.stub(broker, 'isForceAuth', function () {
          return true;
        });

        return view.render()
          .then(function () {
            // Check to make sure the signin link goes "back"
            assert.equal(view.$('a[href="/signin"]').length, 0);
            assert.equal(view.$('a[href="/force_auth?email=testuser%40testuser.com"]').length, 1);
          });
      });

      it('does not allow XSS emails through for forceAuth', function () {
        createDeps();

        sinon.stub(broker, 'isForceAuth', function () {
          return true;
        });

        var xssEmail = 'testuser@testuser.com" onclick="javascript:alert(1)"';

        ephemeralMessages.set('data', {
          email: xssEmail,
          passwordForgotToken: PASSWORD_FORGOT_TOKEN
        });

        createView();

        return view.render()
          .then(function () {
            assert.equal(view.$('a.sign-in').attr('href'), '/force_auth?email=' + encodeURIComponent(xssEmail));
            assert.isFalse(!! view.$('a.sign-in').attr('onclick'));
          });
      });
    });

    describe('completion', function () {
      beforeEach(function () {
        createDeps();
      });

      afterEach(function () {
        destroyView();
      });

      it('finishes correctly if `login` message arrives before server request is made', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          return p(false);
        });

        var _waitForServerConfirmation = view._waitForServerConfirmation;
        sinon.stub(view, '_waitForServerConfirmation', function () {
          // simulate the login occurring in another tab before first
          // verification poll starts.
          interTabChannel.send('login', {
            sessionToken: 'sessiontoken'
          });

          return _waitForServerConfirmation.apply(this, arguments);
        });

        sinon.stub(view, '_finishPasswordResetSameBrowser', function (sessionInfo) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(sessionInfo.sessionToken, 'sessiontoken');
          }, done);
        });

        view.render();
      });

      it('finishes correctly if `login` message arrives while server response is outstanding', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          // simulate the login occurring in another tab before first
          // verification poll completes.
          interTabChannel.send('login', {
            sessionToken: 'sessiontoken'
          });

          // simulate a bit of delay for the XHR request.
          return p(false).delay(100);
        });

        sinon.stub(view, '_finishPasswordResetSameBrowser', function (sessionInfo) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(sessionInfo.sessionToken, 'sessiontoken');
          }, done);
        });

        view.render();

      });

      it('finishes correctly if `login` message arrives after `unverified` server notification, but before the server is re-polled', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          setTimeout(function () {
            // simulate the login occurring in another tab after first
            // server poll completes.
            interTabChannel.send('login', {
              sessionToken: 'sessiontoken'
            });
          }, VERIFICATION_POLL_TIMEOUT_MS / 2);

          return p(false);
        });

        sinon.stub(view, '_finishPasswordResetSameBrowser', function (sessionInfo) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(sessionInfo.sessionToken, 'sessiontoken');
          }, done);
        });

        view.render();
      });

      it('finishes correctly if `login` message arrives after 2nd `unverified` server notification.', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          if (fxaClient.isPasswordResetComplete.callCount === 2) {
            setTimeout(function () {
              // simulate the login occurring in another tab after first
              // server poll completes.
              interTabChannel.send('login', {
                sessionToken: 'sessiontoken'
              });
            }, VERIFICATION_POLL_TIMEOUT_MS / 2);
          }

          return p(false);
        });

        sinon.stub(view, '_finishPasswordResetSameBrowser', function (sessionInfo) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(sessionInfo.sessionToken, 'sessiontoken');
          }, done);
        });

        view.render();
      });

      it('finishes correctly if `login` message arrives before `verified` server notification', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          // simulate the login occurring in another tab before first
          // server poll completes.
          interTabChannel.send('login', {
            sessionToken: 'sessiontoken'
          });

          // simulate a bit of delay for the XHR request.
          return p(true).delay(100);
        });

        sinon.stub(view, '_finishPasswordResetSameBrowser', function (sessionInfo) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(sessionInfo.sessionToken, 'sessiontoken');
          }, done);
        });

        view.render();
      });

      it('finishes correctly if `login` message arrives after `verified` server notification, but before the server is re-polled', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          setTimeout(function () {
            // simulate the login occurring in another tab after first
            // server poll completes.
            interTabChannel.send('login', {
              sessionToken: 'sessiontoken'
            });
          }, VERIFICATION_POLL_TIMEOUT_MS / 2);

          return p(true);
        });

        sinon.stub(view, '_finishPasswordResetSameBrowser', function (sessionInfo) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(sessionInfo.sessionToken, 'sessiontoken');
          }, done);
        });

        view.render();
      });

      it('finishes correctly if `login` message arrives after `verified` message arrives on 2nd poll.', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          if (fxaClient.isPasswordResetComplete.callCount === 2) {
            setTimeout(function () {
              // simulate the login occurring in another tab after first
              // server poll completes.
              interTabChannel.send('login', {
                sessionToken: 'sessiontoken'
              });
            }, VERIFICATION_POLL_TIMEOUT_MS / 2);

            return p(true);
          }

          return p(false);
        });

        sinon.stub(view, '_finishPasswordResetSameBrowser', function (sessionInfo) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(sessionInfo.sessionToken, 'sessiontoken');
          }, done);
        });

        view.render();
      });


      it('finishes correctly if `login` message never arrives', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          return p(true);
        });

        sinon.stub(view, '_finishPasswordResetDifferentBrowser', function () {
          done();
        });

        view.render();
      });

      it('Non direct access redirects to `/reset_password_complete` and notifies the broker when the user has confirmed in the same browser', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          // simulate the sessionToken being set in another tab.
          // simulate the login occurring in another tab.
          interTabChannel.send('login', {
            sessionToken: 'sessiontoken'
          });
          return p(true);
        });

        sinon.stub(broker, 'afterResetPasswordConfirmationPoll', function () {
          return p();
        });

        sinon.stub(user, 'setSignedInAccount', function (account) {
          assert.equal(account.get('sessionToken'), 'sessiontoken');
          return p();
        });

        sinon.stub(relier, 'isDirectAccess', function () {
          return false;
        });

        sinon.stub(view, 'navigate', function (url) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(url, 'reset_password_complete');
            assert.isTrue(TestHelpers.isEventLogged(
                    metrics, 'confirm_reset_password.verification.success'));
            assert.isTrue(user.setSignedInAccount.called);
            assert.isTrue(broker.afterResetPasswordConfirmationPoll.called);
          }, done);
        });

        view.render();
      });

      it('direct access redirects to `/settings` if user verifies in the same browser', function (done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          // simulate the sessionToken being set in another tab.
          // simulate the login occurring in another tab.
          interTabChannel.send('login', {
            sessionToken: 'sessiontoken'
          });
          return p(true);
        });

        sinon.stub(broker, 'afterResetPasswordConfirmationPoll', function () {
          return p();
        });

        sinon.stub(user, 'setSignedInAccount', function (account) {
          assert.equal(account.get('sessionToken'), 'sessiontoken');
          return p();
        });

        sinon.stub(relier, 'isDirectAccess', function () {
          return true;
        });

        sinon.stub(view, 'navigate', function (url) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(url, 'settings');
          }, done);
        });

        view.render();
      });

      it('redirects to /signin if user verifies in a second browser', function (done) {
        sinon.stub(relier, 'isOAuth', function () {
          return false;
        });

        testSecondBrowserVerifyForcesSignIn('signin', done);
      });

      it('oauth flow redirects to /oauth/signin if user verifies in a second browser', function (done) {
        sinon.stub(relier, 'isOAuth', function () {
          return true;
        });

        testSecondBrowserVerifyForcesSignIn('oauth/signin', done);
      });

      function testSecondBrowserVerifyForcesSignIn(expectedPage, done) {
        fxaClient.isPasswordResetComplete.restore();
        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          return p(true);
        });

        sinon.stub(view, 'setTimeout', function (callback) {
          callback();
        });

        sinon.stub(view, 'navigate', function (page) {
          TestHelpers.wrapAssertion(function () {
            assert.equal(page, expectedPage);
          }, done);
        });

        view.render();
      }

      it('displays an error if isPasswordResetComplete blows up', function (done) {
        fxaClient.isPasswordResetComplete.restore();

        sinon.stub(fxaClient, 'isPasswordResetComplete', function () {
          return p().then(function () {
            throw AuthErrors.toError('UNEXPECTED_ERROR');
          });
        });

        sinon.stub(view, 'displayError', function () {
          // if isPasswordResetComplete blows up, it will be after
          // view.render()'s promise has already resolved. Wait for the
          // error to be displayed.
          done();
        });

        view.render();
      });

      it('if the user has confirmed in the same browser and the broker says `halt`, it halts', function () {
        sinon.stub(broker, 'afterResetPasswordConfirmationPoll', function () {
          return p({
            halt: true
          });
        });

        sinon.spy(view, 'navigate');

        return view._finishPasswordResetSameBrowser({})
          .then(function () {
            assert.isFalse(view.navigate.called);
          });
      });
    });

    describe('submit', function () {
      beforeEach(function () {
        createDeps();

        return view.render()
          .then(function () {
            $('#container').html(view.el);
          });
      });

      afterEach(function () {
        destroyView();
      });

      it('resends the confirmation email, shows success message', function () {
        sinon.stub(fxaClient, 'passwordResetResend', function () {
          return p(true);
        });

        sinon.stub(view, 'getStringifiedResumeToken', function () {
          return 'resume token';
        });

        return view.submit()
          .then(function () {
            assert.isTrue(view.$('.success').is(':visible'));

            assert.isTrue(fxaClient.passwordResetResend.calledWith(
              EMAIL,
              PASSWORD_FORGOT_TOKEN,
              relier,
              {
                resume: 'resume token'
              }
            ));
          });
      });

      it('redirects to `/reset_password` if the resend token is invalid', function () {
        sinon.stub(fxaClient, 'passwordResetResend', function () {
          return p().then(function () {
            throw AuthErrors.toError('INVALID_TOKEN', 'Invalid token');
          });
        });

        return view.submit()
              .then(function () {
                assert.equal(routerMock.page, 'reset_password');

                assert.isTrue(TestHelpers.isEventLogged(metrics,
                                  'confirm_reset_password.resend'));
              });
      });

      it('displays other error messages if there is a problem', function () {
        sinon.stub(fxaClient, 'passwordResetResend', function () {
          return p().then(function () {
            throw new Error('synthesized error from auth server');
          });
        });

        return view.submit()
              .then(function () {
                assert(false, 'unexpected success');
              }, function (err) {
                assert.equal(err.message, 'synthesized error from auth server');
              });
      });
    });

    describe('validateAndSubmit', function () {
      beforeEach(function () {
        createDeps();

        return view.render()
          .then(function () {
            $('#container').html(view.el);
          });
      });

      afterEach(function () {
        destroyView();
      });

      it('only called after click on #resend', function () {
        var count = 0;
        view.validateAndSubmit = function () {
          count++;
        };

        view.$('section').click();
        assert.equal(count, 0);

        view.$('#resend').click();
        assert.equal(count, 1);
      });

      it('debounces resend calls - submit on first and forth attempt', function () {
        sinon.stub(fxaClient, 'passwordResetResend', function () {
          return p(true);
        });

        return view.validateAndSubmit()
              .then(function () {
                assert.equal(fxaClient.passwordResetResend.callCount, 1);
                return view.validateAndSubmit();
              }).then(function () {
                assert.equal(fxaClient.passwordResetResend.callCount, 1);
                return view.validateAndSubmit();
              }).then(function () {
                assert.equal(fxaClient.passwordResetResend.callCount, 1);
                return view.validateAndSubmit();
              }).then(function () {
                assert.equal(fxaClient.passwordResetResend.callCount, 2);
                assert.equal(view.$('#resend:visible').length, 0);

                assert.isTrue(TestHelpers.isEventLogged(metrics,
                                  'confirm_reset_password.resend'));
                assert.isTrue(TestHelpers.isEventLogged(metrics,
                                  'confirm_reset_password.too_many_attempts'));
              });
      });
    });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const AuthErrors = require('lib/auth-errors');
  const Backbone = require('backbone');
  const Broker = require('models/auth_brokers/base');
  const Constants = require('lib/constants');
  const MarketingEmailErrors = require('lib/marketing-email-errors');
  const Metrics = require('lib/metrics');
  const Relier = require('models/reliers/relier');
  const TestHelpers = require('../../lib/helpers');
  const Translator = require('lib/translator');
  const User = require('models/user');
  const VerificationReasons = require('lib/verification-reasons');
  const View = require('views/complete_sign_up');
  const WindowMock = require('../../mocks/window');
  const p = require('lib/promise');
  const sinon = require('sinon');

  describe('views/complete_sign_up', () => {
    let account;
    let broker;
    let isSignedIn;
    let metrics;
    let model;
    let relier;
    let translator;
    let user;
    let verificationError;
    let view;
    let windowMock;

    const validCode = TestHelpers.createUid();
    const validUid = TestHelpers.createRandomHexString(Constants.UID_LENGTH);
    const validService = 'someValidService';
    const validReminder = 'validReminder';

    function testShowsExpiredScreen(search) {
      windowMock.location.search = search || '?code=' + validCode + '&uid=' + validUid;
      initView(account);
      return view.render()
        .then(() => {
          assert.ok(view.$('#fxa-verification-link-expired-header').length);
        });
    }

    function testShowsDamagedScreen(search) {
      windowMock.location.search = search || '?code=' + validCode + '&uid=' + validUid;
      initView(account);
      return view.render()
        .then(() => {
          assert.ok(view.$('#fxa-verification-link-damaged-header').length);
        });
    }

    function testErrorLogged(error) {
      var normalizedError = view._normalizeError(error);
      assert.isTrue(TestHelpers.isErrorLogged(metrics, normalizedError));
    }

    function initView (account) {
      view = new View({
        account,
        broker,
        metrics,
        model,
        relier,
        translator,
        user,
        viewName: 'complete_sign_up',
        window: windowMock
      });
    }

    beforeEach(() => {
      windowMock = new WindowMock();

      broker = new Broker();
      metrics = new Metrics();
      model = new Backbone.Model({ type: VerificationReasons.SIGN_UP });
      relier = new Relier({
        window: windowMock
      });
      user = new User();

      verificationError = null;
      translator = new Translator({forceEnglish: true});

      account = user.initAccount({
        email: 'a@a.com',
        sessionToken: 'foo',
        sessionTokenContext: 'context',
        uid: validUid
      });

      sinon.stub(user, 'completeAccountSignUp', () => {
        if (verificationError) {
          return p.reject(verificationError);
        } else {
          return p();
        }
      });

      isSignedIn = true;
      sinon.stub(account, 'isSignedIn', () => p(isSignedIn));

      windowMock.location.search = '?code=' + validCode + '&uid=' + validUid;
      initView(account);
    });

    afterEach(() => {
      metrics.destroy();
      metrics = null;

      view.remove();
      view.destroy();
      view = null;

      windowMock = null;
    });

    describe('getAccount', () => {
      describe('if verifying in the same browser', () => {
        beforeEach(() => {
          sinon.stub(user, 'getAccountByUid', () => account);

          // do not pass in an account, to simulate how the module
          // is initialized in the app. The account should be
          // fetched from the User module, which fetches it
          // from localStorage.
          initView(null);
        });

        it('uses the stored account', () => {
          assert.deepEqual(view.getAccount(), account);
        });
      });

      describe('if verifying in a second browser', () => {
        beforeEach(() => {
          // return the "default" account simulating the user verifying
          // in a second browser.
          sinon.stub(user, 'getAccountByUid', () => user.initAccount({}));

          // do not pass in an account, to simulate how the module
          // is initialized in the app. The account should be
          // fetched from the User module, which fetches it
          // from localStorage.
          initView(null);
        });

        it('returns an account with a `uid`', () => {
          assert.equal(view.getAccount().get('uid'), validUid);
        });
      });
    });

    describe('render', () => {
      beforeEach(() => {
        sinon.stub(broker, 'afterCompleteSignUp', () => p());
        sinon.stub(view, '_notifyBrokerAndComplete', () => p());
      });

      describe('success', () => {
        beforeEach(() => {
          windowMock.location.search = `?code=${validCode}&uid=${validUid}` +
            `&reminder=${validReminder}&server_verification=verified&` +
            'secondary_email_verified=verified&type=secondary';

          return relier.fetch()
            .then(() => {
              relier.set('service', validService);
              initView(account);
              sinon.stub(view, '_notifyBrokerAndComplete', () => p());
              return view.render();
            });
        });

        it('user.completeAccountSignUp called, `_notifyBrokerAndComplete` called', () => {
          assert.isTrue(user.completeAccountSignUp.calledOnce);
          assert.isTrue(user.completeAccountSignUp.calledWith(account, validCode, {
            reminder: validReminder,
            secondaryEmailVerified: 'verified',
            serverVerificationStatus: 'verified',
            service: validService,
            type: 'secondary'
          }));

          assert.isTrue(view._notifyBrokerAndComplete.calledOnce);
          assert.isTrue(view._notifyBrokerAndComplete.calledWith(account));
        });
      });

      describe('failures', () => {
        describe('uid is not available on the URL', () => {
          beforeEach(() => {
            return testShowsDamagedScreen('?code=' + validCode);
          });

          it('logs an error, does not attempt to verify the account', () => {
            testErrorLogged(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
            assert.isFalse(user.completeAccountSignUp.called);
          });
        });

        describe('code is not available on the URL', () => {
          beforeEach(() => {
            return testShowsDamagedScreen('?uid=' + validUid);
          });

          it ('logs an error, does not attempt to verify the account', () => {
            testErrorLogged(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
            assert.isFalse(user.completeAccountSignUp.called);
          });
        });

        describe('email opt-in failures', () => {
          beforeEach(() => {
            verificationError = MarketingEmailErrors.toError('USAGE_ERROR');
            sinon.spy(view, 'logError');
            return view.render();
          });

          it('are logged, verification completes anyways', () => {
            assert.isTrue(view.logError.calledWith(verificationError));

            assert.isTrue(view._notifyBrokerAndComplete.calledOnce);
            assert.isTrue(view._notifyBrokerAndComplete.calledWith(account));
          });
        });

        describe('INVALID_PARAMETER error', () => {
          beforeEach(() => {
            verificationError = AuthErrors.toError('INVALID_PARAMETER', 'code');
            return testShowsDamagedScreen();
          });

          it('logs the error, attempts to verify the account', () => {
            testErrorLogged(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
            assert.isTrue(user.completeAccountSignUp.calledWith(account, validCode));
          });
        });

        describe('UNKNOWN_ACCOUNT error', () => {
          describe('with sessionToken available (user verifies in same browser)', () => {
            beforeEach(() => {
              verificationError = AuthErrors.toError('UNKNOWN_ACCOUNT', 'who are you?');
              sinon.stub(user, 'getAccountByEmail', () => {
                return user.initAccount({
                  sessionToken: 'abc123'
                });
              });
              return testShowsExpiredScreen();
            });

            it('attempts to verify the account, displays link expired, resend link', () => {
              assert.isTrue(user.completeAccountSignUp.calledWith(account, validCode));
              testErrorLogged(AuthErrors.toError('UNKNOWN_ACCOUNT_VERIFICATION'));
              assert.equal(view.$('#resend').length, 1);
            });
          });

          describe('without a sessionToken (user verifies in a different browser)', () => {
            beforeEach(() => {
              verificationError = AuthErrors.toError('UNKNOWN_ACCOUNT', 'who are you?');
              sinon.stub(user, 'getAccountByEmail', () => user.initAccount());
              return testShowsExpiredScreen();
            });

            it('attempts to verify the account, displays link expired, no resend link', () => {
              assert.isTrue(user.completeAccountSignUp.calledWith(account, validCode));
              testErrorLogged(AuthErrors.toError('UNKNOWN_ACCOUNT_VERIFICATION'));
              assert.equal(view.$('#resend').length, 0);
            });
          });
        });

        describe('INVALID_VERIFICATION_CODE error', () => {
          beforeEach(() => {
            verificationError = AuthErrors.toError('INVALID_VERIFICATION_CODE', 'this isn\'t a lottery');
            return testShowsDamagedScreen();
          });

          it('attempts to verify the account, displays link damaged screen', () => {
            assert.isTrue(user.completeAccountSignUp.calledWith(account, validCode));
            testErrorLogged(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
          });
        });

        describe('REUSED_SIGNIN_VERIFICATION_CODE error', () => {
          beforeEach(() => {
            verificationError = AuthErrors.toError('INVALID_VERIFICATION_CODE', 'this isn\'t a lottery');
            model.set('type', VerificationReasons.SIGN_IN);

            return view.render();
          });

          it('displays the verification link expired screen', () => {
            assert.ok(view.$('#fxa-verification-link-reused-header').length);
            testErrorLogged(AuthErrors.toError('REUSED_SIGNIN_VERIFICATION_CODE'));
          });
        });

        describe('all other server errors', () => {
          beforeEach(() => {
            verificationError = AuthErrors.toError('UNEXPECTED_ERROR');
            return view.render().then(() => view.afterVisible());
          });

          it('attempts to verify the account, errors are logged and displayed', () => {
            assert.isTrue(user.completeAccountSignUp.calledWith(account, validCode));
            testErrorLogged(verificationError);
            assert.ok(view.$('#fxa-verification-error-header').length);
            assert.equal(view.$('.error').text(), 'Unexpected error');
          });
        });
      });
    });

    describe('_notifyBrokerAndComplete', () => {
      it('logs, saves the account, invokes the broker method', () => {
        view.notifier = {
          trigger: sinon.spy()
        };

        sinon.spy(view, 'logViewEvent');
        sinon.stub(view, '_getBrokerMethod', () => 'afterCompleteSignUp');
        sinon.stub(view, 'invokeBrokerMethod', () => p());

        sinon.stub(user, 'setAccount', () => p());

        return view._notifyBrokerAndComplete(account)
          .then(() => {
            assert.isTrue(view.logViewEvent.calledOnce);
            assert.isTrue(view.logViewEvent.calledWith('verification.success'));

            assert.isTrue(view.notifier.trigger.calledOnce);
            assert.isTrue(view.notifier.trigger.calledWith('verification.success'));

            assert.isTrue(user.setAccount.calledOnce);
            assert.isTrue(user.setAccount.calledWith(account));

            assert.isTrue(view._getBrokerMethod.calledOnce);

            assert.isTrue(view.invokeBrokerMethod.calledOnce);
            assert.isTrue(view.invokeBrokerMethod.calledWith('afterCompleteSignUp', account));
          });
      });
    });

    describe('_getBrokerMethod', () => {
      it('returns `afterCompleteSignUp` for verifying sign up', () => {
        model.set('type', VerificationReasons.SIGN_UP);
        assert.equal(view._getBrokerMethod(), 'afterCompleteSignUp');
      });

      it('returns `afterCompleteSignIn` for verifying a sign in', () => {
        model.set('type', VerificationReasons.SIGN_IN);
        assert.equal(view._getBrokerMethod(), 'afterCompleteSignIn');
      });

      it('returns `afterCompleteAddSecondaryEmail` for verifying a secondary email', () => {
        model.set('type', VerificationReasons.SECONDARY_EMAIL_VERIFIED);
        assert.equal(view._getBrokerMethod(), 'afterCompleteAddSecondaryEmail');
      });
    });

    describe('resend', () => {
      let retrySignUpAccount;

      beforeEach(() => {
        account = user.initAccount({
          email: 'a@a.com',
          sessionToken: 'foo',
          uid: validUid
        });
      });

      describe('successful resend', () => {
        beforeEach(() => {
          retrySignUpAccount = user.initAccount({
            email: 'a@a.com',
            sessionToken: 'new token',
            uid: validUid
          });

          sinon.stub(retrySignUpAccount, 'retrySignUp', () => p());
          sinon.stub(user, 'getAccountByUid', () => account);
          sinon.stub(user, 'getAccountByEmail', () => retrySignUpAccount);

          sinon.stub(view, 'getStringifiedResumeToken', () => 'resume token');

          return view.resend();
        });

        it('tells the account to retry signUp', () => {
          assert.isTrue(view.getStringifiedResumeToken.calledOnce);
          assert.isTrue(view.getStringifiedResumeToken.calledWith(retrySignUpAccount));
          assert.isTrue(retrySignUpAccount.retrySignUp.calledWith(
            relier,
            {
              resume: 'resume token'
            }
          ));
        });
      });

      describe('resend with invalid resend token', () => {
        beforeEach(() => {
          sinon.stub(account, 'retrySignUp', () => {
            return p.reject(AuthErrors.toError('INVALID_TOKEN'));
          });

          sinon.stub(user, 'getAccountByEmail', () => account);

          sinon.stub(view, 'navigate', () => {});

          return view.resend();
        });

        it('sends the user to the /signup page', () => {
          assert.isTrue(view.navigate.calledWith('signup'));
        });
      });

      describe('other resend errors', () => {
        beforeEach(() => {
          sinon.stub(account, 'retrySignUp', () => {
            return p.reject(AuthErrors.toError('UNEXPECTED_ERROR'));
          });

          sinon.stub(user, 'getAccountByEmail', () => account);
        });

        it('re-throws other errors', () => {
          return view.resend()
            .then(assert.fail, function (err) {
              assert.isTrue(AuthErrors.is(err, 'UNEXPECTED_ERROR'));
            });
        });
      });
    });
  });
});


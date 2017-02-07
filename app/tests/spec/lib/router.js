/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const Account = require('models/account');
  const { assert } = require('chai');
  const AuthErrors = require('lib/auth-errors');
  const Backbone = require('backbone');
  const Constants = require('lib/constants');
  const Metrics = require('lib/metrics');
  const Notifier = require('lib/channels/notifier');
  const p = require('lib/promise');
  const Relier = require('models/reliers/relier');
  const Router = require('lib/router');
  const sinon = require('sinon');
  const User = require('models/user');
  const WindowMock = require('../../mocks/window');

  describe('lib/router', () => {
    let metrics;
    let navigateOptions;
    let navigateUrl;
    let notifier;
    let relier;
    let router;
    let user;
    let windowMock;

    beforeEach(() => {
      navigateUrl = navigateOptions = null;

      notifier = new Notifier();
      metrics = new Metrics({ notifier });
      user = new User();
      windowMock = new WindowMock();

      relier = new Relier({
        window: windowMock
      });

      router = new Router({
        metrics: metrics,
        notifier: notifier,
        relier: relier,
        user: user,
        window: windowMock
      });

      sinon.stub(Backbone.Router.prototype, 'navigate', function (url, options) {
        navigateUrl = url;
        navigateOptions = options;
      });
    });

    afterEach(() => {
      metrics.destroy();
      windowMock = router = navigateUrl = navigateOptions = metrics = null;
      Backbone.Router.prototype.navigate.restore();
    });

    describe('navigate', () => {
      it('tells the router to navigate to a page', () => {
        windowMock.location.search = '';
        router.navigate('/signin');
        assert.equal(navigateUrl, '/signin');
        assert.deepEqual(navigateOptions, { trigger: true });
      });
    });

    describe('`navigate` notifier message', () => {
      beforeEach(() => {
        sinon.spy(router, 'navigate');

        notifier.trigger('navigate', {
          nextViewData: {
            key: 'value'
          },
          routerOptions: {
            clearQueryParams: true,
            trigger: true
          },
          url: 'signin'
        });
      });

      it('calls `navigate` correctly', () => {
        assert.isTrue(router.navigate.calledWith('signin', {
          clearQueryParams: true,
          trigger: true
        }));
      });
    });

    describe('`navigate` notifier message with `server: true`', () => {
      beforeEach(() => {
        sinon.spy(router, 'navigate');
        sinon.spy(router, 'navigateAway');

        notifier.trigger('navigate', {
          server: true,
          url: 'wibble'
        });
      });

      it('navigated correctly', () => {
        assert.equal(router.navigate.callCount, 0);
        assert.equal(router.navigateAway.callCount, 1);
        const args = router.navigateAway.args[0];
        assert.lengthOf(args, 1);
        assert.equal(args[0], 'wibble');
      });
    });

    describe('navigateAway', () => {
      beforeEach(() => {
        sinon.spy(metrics, 'flush');
        sinon.spy(router, 'navigate');

        return router.navigateAway('blee');
      });

      it('called metrics.flush correctly', () => {
        assert.equal(metrics.flush.callCount, 1);
        assert.lengthOf(metrics.flush.args[0], 0);
      });

      it('navigated correctly', () => {
        assert.equal(router.navigate.callCount, 0);
        assert.equal(windowMock.location.href, 'blee');
      });
    });

    describe('`navigate-back` notifier message', () => {
      beforeEach(() => {
        sinon.spy(router, 'navigateBack');

        notifier.trigger('navigate-back', {
          nextViewData: {
            key: 'value'
          }
        });
      });

      it('calls `navigateBack` correctly', () => {
        assert.isTrue(router.navigateBack.called);
      });
    });

    describe('set query params', () => {
      beforeEach(() => {
        windowMock.location.search = '?context=' + Constants.FX_DESKTOP_V1_CONTEXT;
      });

      describe('navigate with default options', () => {
        beforeEach(() => {
          router.navigate('/forgot');
        });

        it('preserves query params', () => {
          assert.equal(navigateUrl, '/forgot?context=' + Constants.FX_DESKTOP_V1_CONTEXT);
          assert.deepEqual(navigateOptions, { trigger: true });
        });
      });

      describe('navigate with clearQueryParams option set', () => {
        beforeEach(() => {
          router.navigate('/forgot', { clearQueryParams: true });
        });

        it('clears the query params if clearQueryString option is set', () => {
          assert.equal(navigateUrl, '/forgot');
          assert.deepEqual(navigateOptions, { clearQueryParams: true, trigger: true });
        });
      });
    });

    describe('navigateBack', () => {
      beforeEach(() => {
        sinon.spy(windowMock.history, 'back');

        router.navigateBack();
      });

      it('calls `window.history.back`', () => {
        assert.isTrue(windowMock.history.back.called);
      });
    });

    describe('redirectToSignupOrSettings', () => {
      it('replaces current page with the signup page if there is no current account', () => {
        windowMock.location.search = '';
        router.redirectToSignupOrSettings();
        assert.equal(navigateUrl, '/signup');
        assert.deepEqual(navigateOptions, { replace: true, trigger: true });
      });

      it('replaces the current page with the settings page if there is a current account', () => {
        windowMock.location.search = '';
        sinon.stub(user, 'getSignedInAccount', () => {
          return user.initAccount({
            sessionToken: 'abc123'
          });
        });
        router.redirectToSignupOrSettings();
        assert.equal(navigateUrl, '/settings');
        assert.deepEqual(navigateOptions, { replace: true, trigger: true });
      });
    });

    describe('redirectToBestOAuthChoice', () => {
      describe('no email in params', () => {
        it('replaces current page with the signup page if there is no current account', () => {
          windowMock.location.search = '';
          return router.redirectToBestOAuthChoice()
            .then(() => {
              assert.equal(navigateUrl, '/oauth/signup');
              assert.deepEqual(navigateOptions, { replace: true, trigger: true });
            });
        });

        it('replaces the current page with the signin page', () => {
          windowMock.location.search = '';
          sinon.stub(user, 'getChooserAccount', () => {
            return user.initAccount({
              sessionToken: 'abc123'
            });
          });

          return router.redirectToBestOAuthChoice()
            .then(() => {
              assert.equal(navigateUrl, '/oauth/signin');
              assert.deepEqual(navigateOptions, { replace: true, trigger: true });
            });
        });
      });

      describe('email in params', () => {
        var accountExists;
        beforeEach(() => {
          accountExists = false;

          sinon.stub(user, 'checkAccountEmailExists', () => {
            if (accountExists instanceof Error) {
              return p.reject(accountExists);
            } else {
              return p(accountExists);
            }
          });

          relier.set('email', 'test@email.com');
        });

        it('navigate to signup page if email is not associated with account', () => {
          accountExists = false;

          return router.redirectToBestOAuthChoice()
            .then(() => {
              assert.include(navigateUrl, '/oauth/signup');
              assert.deepEqual(navigateOptions, { replace: true, trigger: true });
            });
        });

        it('navigate to signin page if email is associated with account', () => {
          accountExists = true;

          return router.redirectToBestOAuthChoice()
            .then(() => {
              assert.include(navigateUrl, '/oauth/signin');
              assert.deepEqual(navigateOptions, { replace: true, trigger: true });
            });
        });

        it('logs and swallows any errors that are thrown checking whether the email is registered', () => {
          var err = AuthErrors.toError('THROTTLED');
          accountExists = err;

          sinon.spy(metrics, 'logError');
          sinon.stub(user, 'getChooserAccount', () => {
            // return a default account to ensure user is sent to signup
            return new Account({});
          });

          return router.redirectToBestOAuthChoice()
            .then(() => {
              assert.isTrue(metrics.logError.calledWith(err));
              assert.include(navigateUrl, '/oauth/signup');
              assert.deepEqual(navigateOptions, { replace: true, trigger: true });
            });
        });
      });
    });

    describe('`view-shown` notifier message', () => {
      it('calls `onFirstViewRendered` correctly', () => {
        sinon.spy(router, 'onFirstViewRendered');

        notifier.trigger('view-shown');
        // the 2nd trigger should be ignored.
        notifier.trigger('view-shown');
        assert.isTrue(router.onFirstViewRendered.calledOnce);
      });
    });

    describe('onFirstViewRendered', () => {
      it('sets `canGoBack`', function () {
        router.onFirstViewRendered();

        assert.isTrue(router.storage.get('canGoBack'));
      });
    });

    describe('pathToViewName', () => {
      it('strips leading /', () => {
        assert.equal(router.fragmentToViewName('/signin'), 'signin');
      });

      it('strips trailing /', () => {
        assert.equal(router.fragmentToViewName('signup/'), 'signup');
      });

      it('converts middle / to .', () => {
        assert.equal(router.fragmentToViewName('/legal/tos/'), 'legal.tos');
      });

      it('converts _ to -', () => {
        assert.equal(router.fragmentToViewName('complete_sign_up'),
            'complete-sign-up');
      });

      it('strips search parameters', () => {
        assert.equal(router.fragmentToViewName('complete_sign_up/?email=testuser@testuser.com'),
            'complete-sign-up');
      });

    });

    describe('notifyOfRouteChange', () => {
      it('triggers a `show-view` notification', () => {
        sinon.spy(notifier, 'trigger');
        sinon.stub(router, 'getCurrentPage', () => 'route-name');
        router.notifyOfRouteChange();

        assert.isTrue(notifier.trigger.calledOnce);
        const args = notifier.trigger.args[0];
        assert.equal(args[0], 'change:route');

        assert.isObject(args[1]);
        assert.equal(args[1].route, 'route-name');

        assert.isObject(args[1].options);
      });
    });

    describe('canGoBack initial value', () => {
      it('is `false` if sessionStorage.canGoBack is not set', () => {
        assert.isUndefined(router.storage._backend.getItem('canGoBack'));
      });

      it('is `true` if sessionStorage.canGoBack is set', () => {
        windowMock.sessionStorage.setItem('canGoBack', true);
        router = new Router({
          metrics: metrics,
          notifier: notifier,
          relier: relier,
          user: user,
          window: windowMock
        });
        assert.isTrue(router.storage._backend.getItem('canGoBack'));
      });
    });

    describe('getCurrentPage', () => {
      it('returns the current screen URL based on Backbone.history.fragment', () => {
        Backbone.history.fragment = 'settings';
        assert.equal(router.getCurrentPage(), 'settings');
      });

      it('strips leading `/` from the fragment', () => {
        Backbone.history.fragment = '/force_auth';
        assert.equal(router.getCurrentPage(), 'force_auth');
      });

      it('strips trailing `/` from the fragment', () => {
        Backbone.history.fragment = 'force_auth/';
        assert.equal(router.getCurrentPage(), 'force_auth');
      });

      it('strips any query parameters from the fragment', () => {
        Backbone.history.fragment = 'force_auth/?email=testuser@testuser.com';
        assert.equal(router.getCurrentPage(), 'force_auth');
      });

    });
  });
});

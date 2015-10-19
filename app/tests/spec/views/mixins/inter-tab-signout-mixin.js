/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'cocktail',
  'sinon',
  'views/base',
  'views/mixins/inter-tab-signout-mixin'
], function (chai, Cocktail, sinon, BaseView, InterTabSignoutMixin) {
  'use strict';

  var assert = chai.assert;

  var View = BaseView.extend({});
  Cocktail.mixin(View, InterTabSignoutMixin);

  describe('views/mixins/inter-tab-signout-mixin', function () {
    var view;

    before(function () {
      view = new View();
    });

    afterEach(function () {
      view.destroy();
    });

    it('exports correct interface', function () {
      var methods = [
        'afterVisible',
        'initialize',
        'interTabOn',
        'interTabOff',
        'interTabOffAll',
        'interTabSend',
        'interTabClear',
        'onSignOutSuccess'
      ];
      assert.lengthOf(Object.keys(InterTabSignoutMixin), methods.length);
      methods.forEach(function (methodName) {
        assert.isFunction(InterTabSignoutMixin[methodName]);
        assert.isFunction(view[methodName]);
      });
      assert.isUndefined(view.clearSessionAndNavigateToSignIn);
    });

    describe('afterVisible', function () {
      before(function () {
        view.interTabOn = sinon.spy();
        view.afterVisible();
      });

      it('defines the clearSessionAndNavigateToSignIn method', function () {
        assert.isFunction(view.clearSessionAndNavigateToSignIn);
        assert.lengthOf(view.clearSessionAndNavigateToSignIn, 0);
      });

      it('calls interTabOn correctly', function () {
        assert.equal(view.interTabOn.callCount, 1);
        assert.isTrue(view.interTabOn.alwaysCalledOn(view));
        var args = view.interTabOn.args[0];
        assert.lengthOf(args, 2);
        assert.equal(args[0], 'signout.success');
        assert.equal(args[1], view.clearSessionAndNavigateToSignIn);
      });

      describe('clearSessionAndNavigateToSignIn', function () {
        before(function () {
          view.logScreenEvent = sinon.spy();
          view.user = {
            removeAllAccounts: sinon.spy()
          };
          view._formPrefill = {
            clear: sinon.spy()
          };
          view.navigate = sinon.spy();
          view.clearSessionAndNavigateToSignIn();
        });

        it('calls logScreenEvent correctly', function () {
          assert.equal(view.logScreenEvent.callCount, 1);
          assert.isTrue(view.logScreenEvent.alwaysCalledOn(view));
          var args = view.logScreenEvent.args[0];
          assert.lengthOf(args, 1);
          assert.equal(args[0], 'signout.success');
        });

        it('calls user.removeAllAccounts correctly', function () {
          assert.equal(view.user.removeAllAccounts.callCount, 1);
          assert.isTrue(view.user.removeAllAccounts.alwaysCalledOn(view.user));
          assert.lengthOf(view.user.removeAllAccounts.args[0], 0);
        });

        it('calls _formPrefill.clear correctly', function () {
          assert.equal(view._formPrefill.clear.callCount, 1);
          assert.isTrue(view._formPrefill.clear.alwaysCalledOn(view._formPrefill));
          assert.lengthOf(view._formPrefill.clear.args[0], 0);
        });

        it('calls navigate correctly', function () {
          assert.equal(view.navigate.callCount, 1);
          assert.isTrue(view.navigate.alwaysCalledOn(view));
          assert.isTrue(view.navigate.calledAfter(view.user.removeAllAccounts));
          assert.isTrue(view.navigate.calledAfter(view._formPrefill.clear));
          var args = view.navigate.args[0];
          assert.lengthOf(args, 2);
          assert.equal(args[0], 'signin');
          assert.isObject(args[1]);
          assert.lengthOf(Object.keys(args[1]), 1);
          assert.equal(args[1].success, 'Signed out successfully');
        });
      });

      describe('onSignOutSuccess', function () {
        before(function () {
          view.interTabOff = sinon.spy();
          view.interTabSend = sinon.spy();
          view.clearSessionAndNavigateToSignIn = sinon.spy();
          view.onSignOutSuccess();
        });

        it('calls interTabOff correctly', function () {
          assert.equal(view.interTabOff.callCount, 1);
          assert.isTrue(view.interTabOff.alwaysCalledOn(view));
          var args = view.interTabOff.args[0];
          assert.lengthOf(args, 2);
          assert.equal(args[0], 'signout.success');
          assert.equal(args[1], view.clearSessionAndNavigateToSignIn);
        });

        it('calls interTabSend correctly', function () {
          assert.equal(view.interTabSend.callCount, 1);
          assert.isTrue(view.interTabSend.alwaysCalledOn(view));
          assert.isTrue(view.interTabSend.calledAfter(view.interTabOff));
          var args = view.interTabSend.args[0];
          assert.lengthOf(args, 1);
          assert.equal(args[0], 'signout.success');
        });

        it('calls clearSessionAndNavigateToSignIn correctly', function () {
          assert.equal(view.clearSessionAndNavigateToSignIn.callCount, 1);
          assert.isTrue(view.clearSessionAndNavigateToSignIn.alwaysCalledOn(view));
          assert.lengthOf(view.clearSessionAndNavigateToSignIn.args[0], 0);
        });
      });
    });
  });
});


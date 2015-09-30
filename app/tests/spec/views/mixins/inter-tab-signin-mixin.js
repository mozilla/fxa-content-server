/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'chai',
  'cocktail',
  'sinon',
  'lib/promise',
  'views/base',
  'views/mixins/inter-tab-signin-mixin'
], function (chai, Cocktail, sinon, p, BaseView, InterTabSignInMixin) {
  'use strict';

  var assert = chai.assert;

  var View = BaseView.extend({});
  Cocktail.mixin(View, InterTabSignInMixin);

  describe('views/mixins/inter-tab-signin-mixin', function () {
    var view;

    before(function () {
      view = new View();
    });

    after(function () {
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
        'onSignInSuccess'
      ];
      assert.lengthOf(Object.keys(InterTabSignInMixin), methods.length);
      methods.forEach(function (methodName) {
        assert.isFunction(InterTabSignInMixin[methodName]);
        assert.isFunction(view[methodName]);
      });
      assert.isUndefined(view.navigateToSignedInView);
    });

    describe('afterVisible', function () {
      before(function () {
        view.interTabOn = sinon.spy();
        view.afterVisible();
      });

      it('defines the navigateToSignedInView method', function () {
        assert.isFunction(view.navigateToSignedInView);
        assert.lengthOf(view.navigateToSignedInView, 1);
      });

      it('calls interTabOn correctly', function () {
        assert.equal(view.interTabOn.callCount, 1);
        assert.isTrue(view.interTabOn.alwaysCalledOn(view));
        var args = view.interTabOn.args[0];
        assert.lengthOf(args, 2);
        assert.equal(args[0], 'signin.success');
        assert.equal(args[1], view.navigateToSignedInView);
      });

      describe('navigateToSignedInView', function () {
        before(function () {
          view.broker = {
            hasCapability: sinon.spy(function () {
              return true;
            })
          };
          view.user = {
            setSignedInAccount: sinon.spy(function () {
              return p();
            })
          };
          view.navigate = sinon.spy();
          return view.navigateToSignedInView({
            data: 'foo'
          });
        });

        it('calls broker.hasCapability correctly', function () {
          assert.equal(view.broker.hasCapability.callCount, 1);
          assert.isTrue(view.broker.hasCapability.alwaysCalledOn(view.broker));
          var args = view.broker.hasCapability.args[0];
          assert.lengthOf(args, 1);
          assert.equal(args[0], 'interTabSignIn');
        });

        it('calls user.setSignedInAccount correctly', function () {
          assert.equal(view.user.setSignedInAccount.callCount, 1);
          assert.isTrue(view.user.setSignedInAccount.alwaysCalledOn(view.user));
          var args = view.user.setSignedInAccount.args[0];
          assert.lengthOf(args, 1);
          assert.equal(args[0], 'foo');
        });

        it('calls navigate correctly', function () {
          assert.equal(view.navigate.callCount, 1);
          assert.isTrue(view.navigate.alwaysCalledOn(view));
          assert.isTrue(view.navigate.calledAfter(view.user.setSignedInAccount));
          var args = view.navigate.args[0];
          assert.lengthOf(args, 1);
          assert.equal(args[0], 'settings');
        });
      });

      describe('navigateToSignedInView without interTabSignIn capability', function () {
        before(function () {
          view.broker = {
            hasCapability: sinon.spy(function () {
              return false;
            })
          };
          view.user = {
            setSignedInAccount: sinon.spy(function () {
              return p();
            })
          };
          view.navigate = sinon.spy();
          view.navigateToSignedInView({
            data: 'foo'
          });
        });

        it('calls broker.hasCapability', function () {
          assert.equal(view.broker.hasCapability.callCount, 1);
        });

        it('does not call user.setSignedInAccount', function () {
          assert.equal(view.user.setSignedInAccount.callCount, 0);
        });

        it('does not call navigate', function () {
          assert.equal(view.navigate.callCount, 0);
        });
      });

      describe('navigateToSignedInView with OAuth redirect URL', function () {
        before(function () {
          view.broker = {
            hasCapability: sinon.spy(function () {
              return true;
            })
          };
          view.user = {
            setSignedInAccount: sinon.spy(function () {
              return p();
            })
          };
          view.navigate = sinon.spy();
          view._redirectTo = 'foo';
          return view.navigateToSignedInView({
            data: 'bar'
          });
        });

        it('calls broker.hasCapability', function () {
          assert.equal(view.broker.hasCapability.callCount, 1);
        });

        it('calls user.setSignedInAccount correctly', function () {
          assert.equal(view.user.setSignedInAccount.callCount, 1);
          assert.equal(view.user.setSignedInAccount.args[0][0], 'bar');
        });

        it('calls navigate correctly', function () {
          assert.equal(view.navigate.callCount, 1);
          assert.equal(view.navigate.args[0][0], 'foo');
        });
      });

      describe('onSignInSuccess', function () {
        before(function () {
          view.interTabOff = sinon.spy();
          view.interTabSend = sinon.spy();
          view.navigateToSignedInView = sinon.spy();
          view.onSignInSuccess('foo');
        });

        it('calls interTabOff correctly', function () {
          assert.equal(view.interTabOff.callCount, 1);
          assert.isTrue(view.interTabOff.alwaysCalledOn(view));
          var args = view.interTabOff.args[0];
          assert.lengthOf(args, 2);
          assert.equal(args[0], 'signin.success');
          assert.equal(args[1], view.navigateToSignedInView);
        });

        it('calls interTabSend correctly', function () {
          assert.equal(view.interTabSend.callCount, 1);
          assert.isTrue(view.interTabSend.alwaysCalledOn(view));
          assert.isTrue(view.interTabSend.calledAfter(view.interTabOff));
          var args = view.interTabSend.args[0];
          assert.lengthOf(args, 2);
          assert.equal(args[0], 'signin.success');
          assert.equal(args[1], 'foo');
        });

        it('does not call navigateToSignedInView', function () {
          assert.equal(view.navigateToSignedInView.callCount, 0);
        });
      });
    });
  });
});


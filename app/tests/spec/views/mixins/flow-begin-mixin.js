/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var chai = require('chai');
  var flowBeginMixin = require('views/mixins/flow-begin-mixin');
  var sinon = require('sinon');

  var assert = chai.assert;

  describe('views/mixins/flow-begin-mixin', function () {
    it('exports correct interface', function () {
      assert.lengthOf(Object.keys(flowBeginMixin), 1);
      assert.isFunction(flowBeginMixin.afterRender);
      assert.lengthOf(flowBeginMixin.afterRender, 0);
    });

    describe('afterRender', function () {
      beforeEach(function () {
        flowBeginMixin.user = {
          beginFlow: sinon.spy(),
          on: sinon.spy()
        };
        $('body').attr('data-flow-begin', '42');
        flowBeginMixin.afterRender();
      });

      it('called user.beginFlow correctly', function () {
        assert.strictEqual(flowBeginMixin.user.beginFlow.callCount, 1);
        var args = flowBeginMixin.user.beginFlow.args[0];
        assert.strictEqual(args.length, 1);
        assert.strictEqual(args[0], 42);
      });

      it('called user.on correctly', function () {
        assert.strictEqual(flowBeginMixin.user.on.callCount, 1);
        var args = flowBeginMixin.user.on.args[0];
        assert.lengthOf(args, 2);
        assert.strictEqual(args[0], 'end-flow');
        assert.isFunction(args[1]);
        assert.lengthOf(args[1], 0);
      });

      it('data-flow-begin attribute is correct', function () {
        assert.strictEqual($('body').attr('data-flow-begin'), '42');
      });

      describe('end-flow handler', function () {
        beforeEach(function () {
          flowBeginMixin.user.on.args[0][1]();
        });

        it('data-flow-begin attribute was removed', function () {
          assert.isUndefined($('body').attr('data-flow-begin'));
        });
      });
    });
  });
});


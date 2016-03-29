/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var assert = require('chai').assert;
  var FlowModel = require('models/flow');
  var sinon = require('sinon');

  describe('models/flow', function () {
    var metrics, storage, localStorageFlowId, flow;

    beforeEach(function () {
      metrics = {
        logFlowBegin: sinon.spy()
      };
      storage = {
        get: sinon.spy(function () {
          return localStorageFlowId;
        }),
        remove: sinon.spy(),
        set: sinon.spy()
      };
      flow = new FlowModel({
        metrics: metrics,
        storage: storage
      });
    });

    it('exports the correct interface', function () {
      assert.isFunction(flow.initialize);
      assert.isFunction(flow.begin);
      assert.isFunction(flow.end);
      assert.isFunction(flow.has);
      assert.isFunction(flow.get);
      assert.isFunction(flow.set);
      assert.isFunction(flow.clear);
      assert.isFunction(flow.populateFromStringifiedResumeToken);
      assert.isFunction(flow.getSearchParam);

      assert.isObject(flow.defaults);
      assert.lengthOf(Object.keys(flow.defaults), 1);
      assert.isNull(flow.defaults.flowId);

      assert.isArray(flow.resumeTokenFields);
      assert.lengthOf(flow.resumeTokenFields, 1);
      assert.equal(flow.resumeTokenFields[0], 'flowId');

      assert.isObject(flow.resumeTokenSchema);
      assert.lengthOf(Object.keys(flow.resumeTokenSchema), 1);
      assert.isObject(flow.resumeTokenSchema.flowId);
    });

    describe('begin with flowId in resume token', function () {
      beforeEach(function () {
        sinon.stub(flow, 'populateFromStringifiedResumeToken', function () {
          flow.set('flowId', 'foo');
        });
        sinon.stub(flow, 'getSearchParam', function () {
          return 'bar';
        });
        flow.begin('bar');
      });

      afterEach(function () {
        flow.populateFromStringifiedResumeToken.restore();
        flow.getSearchParam.restore();
      });

      it('called this.getSearchParam correctly', function () {
        assert.strictEqual(flow.getSearchParam.callCount, 1);
        var args = flow.getSearchParam.args[0];
        assert.lengthOf(args, 1);
        assert.strictEqual(args[0], 'resume');
      });

      it('called this.populateFromStringifiedResumeToken correctly', function () {
        assert.strictEqual(flow.populateFromStringifiedResumeToken.callCount, 1);
        var args = flow.populateFromStringifiedResumeToken.args[0];
        assert.lengthOf(args, 1);
        assert.strictEqual(args[0], 'bar');
      });

      it('did not call _storage.get', function () {
        assert.strictEqual(storage.get.callCount, 0);
      });

      it('did not call _metrics.logFlowBegin', function () {
        assert.strictEqual(metrics.logFlowBegin.callCount, 0);
      });

      it('set flowId correctly', function () {
        assert.strictEqual(flow.get('flowId'), 'foo');
      });
    });

    describe('begin with flowId in local storage', function () {
      beforeEach(function () {
        localStorageFlowId = 'wibble';
        flow.begin('blee');
      });

      afterEach(function () {
        localStorageFlowId = undefined;
      });

      it('called _storage.get correctly', function () {
        assert.strictEqual(storage.get.callCount, 1);
        var args = storage.get.args[0];
        assert.lengthOf(args, 1);
        assert.strictEqual(args[0], 'flowId');
      });

      it('did not call _metrics.logFlowBegin', function () {
        assert.strictEqual(metrics.logFlowBegin.callCount, 0);
      });

      it('set flowId correctly', function () {
        assert.strictEqual(flow.get('flowId'), 'wibble');
      });
    });

    describe('begin without flowId', function () {
      beforeEach(function () {
        flow.begin('foo');
      });

      afterEach(function () {
        localStorageFlowId = undefined;
      });

      it('called _metrics.logFlowBegin correctly', function () {
        assert.strictEqual(metrics.logFlowBegin.callCount, 1);
        var args = metrics.logFlowBegin.args[0];
        assert.lengthOf(args, 2);
        assert.match(args[0], /^[0-9a-f]{64}$/);
        assert.strictEqual(args[1], 'foo');
      });

      it('set flowId correctly', function () {
        assert.strictEqual(flow.get('flowId'), metrics.logFlowBegin.args[0][0]);
      });
    });

    describe('begin without flowId or flowBeginTime', function () {
      beforeEach(function () {
        flow.begin(NaN);
      });

      afterEach(function () {
        localStorageFlowId = undefined;
      });

      it('called _metrics.logFlowBegin correctly', function () {
        assert.strictEqual(metrics.logFlowBegin.callCount, 1);
        var args = metrics.logFlowBegin.args[0];
        assert.lengthOf(args, 2);
        assert.match(args[0], /^[0-9a-f]{64}$/);
        assert.isUndefined(args[1]);
      });

      it('set flowId correctly', function () {
        assert.strictEqual(flow.get('flowId'), metrics.logFlowBegin.args[0][0]);
      });
    });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var FLOW_ID_REGEX = /^[0-9a-f]{32}$/;

define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!bluebird',
  'intern/dojo/node!path',
  'intern/dojo/node!proxyquire',
  'intern/dojo/node!sinon',
], function (registerSuite, assert, Promise, path, proxyquire, sinon) {
  var activityEvent, route, request, response;

  registerSuite({
    name: 'routes/get-index',

    setup: function () {
      activityEvent = sinon.spy();
      route = proxyquire(path.resolve('server/lib/routes/get-index'), {
        '../activity-event': activityEvent
      });
    },

    'interface is correct': function () {
      assert.isFunction(route);
      assert.lengthOf(route, 0);

      var instance = route();
      assert.isObject(instance);
      assert.lengthOf(Object.keys(instance), 3);
      assert.equal(instance.method, 'get');
      assert.equal(instance.path, '/');

      assert.isFunction(instance.process);
      assert.lengthOf(instance.process, 2);
    },

    'route.process': {
      setup: function () {
        request = {};
        response = { render: sinon.spy() };
        route().process(request, response);
      },

      'response.render was called correctly': function () {
        assert.equal(response.render.callCount, 1);
        assert.equal(response.render.thisValues[0], response);
        var args = response.render.args[0];
        assert.lengthOf(args, 2);
        assert.equal(args[0], 'index');
        assert.isObject(args[1]);
        assert.lengthOf(Object.keys(args[1]), 2);
        assert.match(args[1].flowId, FLOW_ID_REGEX);
        assert.isAbove(args[1].flowBeginTime, 0);
      },

      'activityEvent was called correctly': function () {
        assert.equal(activityEvent.callCount, 1);
        assert.isTrue(activityEvent.calledAfter(response.render));

        var args = activityEvent.args[0];
        assert.lengthOf(args, 4);

        assert.equal(args[0], 'flow.begin');

        assert.isObject(args[1]);
        assert.lengthOf(Object.keys(args[1]), 3);
        assert.equal(args[1].flow_id, response.render.args[0][1].flowId);
        assert.strictEqual(args[1].flow_time, 0);
        assert.isAbove(args[1].time, 0);

        assert.equal(args[2], request);

        assert.isArray(args[3]);
        assert.lengthOf(args[3], 9);
        assert.include(args[3], 'context');
        assert.include(args[3], 'entrypoint');
        assert.include(args[3], 'migration');
        assert.include(args[3], 'service');
        assert.include(args[3], 'utm_campaign');
        assert.include(args[3], 'utm_content');
        assert.include(args[3], 'utm_medium');
        assert.include(args[3], 'utm_source');
        assert.include(args[3], 'utm_term');
      }
    }
  });
});

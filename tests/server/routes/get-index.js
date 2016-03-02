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
  var route, request, response, write, random;

  registerSuite({
    name: 'routes/get-index, sample rate 100%',

    setup: function () {
      route = proxyquire(path.resolve('server/lib/routes/get-index'), {
        '../configuration': {
          get: function (property) {
            if (property !== 'activity_events.sample_rate') {
              throw new Error('Bad property `' + property + '` in mock config.get');
            }
            return 1;
          }
        }
      });
    },

    'interface is correct': function () {
      assert.isFunction(route);
      var instance = route();
      assert.isObject(instance);
      assert.lengthOf(Object.keys(instance), 3);
      assert.equal(instance.method, 'get');
      assert.equal(instance.path, '/');
      assert.isFunction(instance.process);
    },

    'route.process': {
      setup: function () {
        request = {
          headers: { 'user-agent': 'foo' },
          query: {
            context: 'bar',
            entrypoint: 'baz',
            migration: 'qux',
            service: 'wibble',
            utm_campaign: 'utm_foo', //eslint-disable-line camelcase
            utm_content: 'utm_bar', //eslint-disable-line camelcase
            utm_medium: 'utm_baz', //eslint-disable-line camelcase
            utm_source: 'utm_qux', //eslint-disable-line camelcase
            utm_term: 'blee', //eslint-disable-line camelcase
            zignore: 'ignore me'
          }
        };
        response = { render: sinon.spy() };
        write = process.stderr.write;
        process.stderr.write = sinon.spy();
        route().process(request, response);
        return new Promise(function (resolve) {
          setImmediate(function () {
            resolve();
          });
        });
      },

      teardown: function () {
        process.stderr.write = write;
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

      'process.stderr.write was called correctly': function () {
        assert.equal(process.stderr.write.callCount, 1);

        assert.isTrue(process.stderr.write.calledAfter(response.render));
        assert.equal(process.stderr.write.thisValues[0], process.stderr);

        var args = process.stderr.write.args[0];
        assert.lengthOf(args, 1);
        assert.equal(args[0].substr(0, 14), 'activityEvent ');
        assert.equal(args[0][args[0].length - 1], '\n');

        var eventData = JSON.parse(args[0].substr(14));
        assert.lengthOf(Object.keys(eventData), 17);
        assert.isNull(eventData.device_id);
        assert.equal(eventData.event, 'flow.begin');
        assert.equal(eventData.flow_id, response.render.args[0][1].flowId);
        assert.strictEqual(eventData.flow_time, 0);
        assert.isFalse(eventData.new_user);
        assert.equal(eventData.time, response.render.args[0][1].flowBeginTime);
        assert.isNull(eventData.uid);
        assert.equal(eventData.userAgent, 'foo');
        assert.equal(eventData.context, 'bar');
        assert.equal(eventData.entrypoint, 'baz');
        assert.equal(eventData.migration, 'qux');
        assert.equal(eventData.service, 'wibble');
        assert.equal(eventData.utm_campaign, 'utm_foo');
        assert.equal(eventData.utm_content, 'utm_bar');
        assert.equal(eventData.utm_medium, 'utm_baz');
        assert.equal(eventData.utm_source, 'utm_qux');
        assert.equal(eventData.utm_term, 'blee');
        assert.isUndefined(eventData.zignore);
      }
    }
  });

  registerSuite({
    name: 'routes/get-index, sample rate 50%',

    setup: function () {
      route = proxyquire(path.resolve('server/lib/routes/get-index'), {
        '../configuration': {
          get: function (property) {
            if (property !== 'activity_events.sample_rate') {
              throw new Error('Bad property `' + property + '` in mock config.get');
            }
            return 0.5;
          }
        }
      });
      random = Math.random;
      var count = 0;
      Math.random = sinon.spy(function () {
        if (++count % 2 === 1) {
          return 0.49;
        }
        return 0.5;
      });
      request = {
        headers: { 'user-agent': 'foo' },
        query: {}
      };
      response = { render: sinon.spy() };
      write = process.stderr.write;
      process.stderr.write = sinon.spy();
      for (var i = 0; i < 6; ++i) {
        route().process(request, response);
      }
      return new Promise(function (resolve) {
        setImmediate(function () {
          resolve();
        });
      });
    },

    teardown: function () {
      Math.random = random;
      process.stderr.write = write;
    },

    'response.render was called 6 times': function () {
      assert.equal(response.render.callCount, 6);
    },

    'response.render was called without view data the 2nd, 4th and 6th times': function () {
      var args = response.render.args;
      assert.lengthOf(args[1], 1);
      assert.equal(args[1][0], 'index');
      assert.lengthOf(args[3], 1);
      assert.lengthOf(args[5], 1);
    },

    'response.render was called with view data the 1st, 3rd and 5th times': function () {
      var args = response.render.args;
      assert.lengthOf(args[0], 2);
      assert.lengthOf(args[2], 2);
      assert.lengthOf(args[4], 2);
    },

    'process.stderr.write was called 3 times': function () {
      assert.equal(process.stderr.write.callCount, 3);
    }
  });

  registerSuite({
    name: 'routes/get-index, sample rate 1%',

    setup: function () {
      route = proxyquire(path.resolve('server/lib/routes/get-index'), {
        '../configuration': {
          get: function (property) {
            if (property !== 'activity_events.sample_rate') {
              throw new Error('Bad property `' + property + '` in mock config.get');
            }
            return 0.1;
          }
        }
      });
      random = Math.random;
      var count = 0;
      Math.random = sinon.spy(function () {
        if (++count % 100 === 1) {
          return 0.09;
        }
        return 0.1;
      });
      request = {
        headers: { 'user-agent': 'foo' },
        query: {}
      };
      response = { render: sinon.spy() };
      write = process.stderr.write;
      process.stderr.write = sinon.spy();
      for (var i = 0; i < 101; ++i) {
        route().process(request, response);
      }
      return new Promise(function (resolve) {
        setImmediate(function () {
          resolve();
        });
      });
    },

    teardown: function () {
      Math.random = random;
      process.stderr.write = write;
    },

    'response.render was called 101 times': function () {
      assert.equal(response.render.callCount, 101);
    },

    'process.stderr.write was called twice': function () {
      assert.equal(process.stderr.write.callCount, 2);
    }
  });
});

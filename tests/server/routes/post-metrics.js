/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!bluebird',
  'intern/dojo/node!lodash',
  'intern/dojo/node!path',
  'intern/dojo/node!proxyquire',
  'intern/dojo/node!sinon',
  'intern/dojo/node!../helpers/init-logging'
], function (registerSuite, assert, Promise, _, path, proxyquire, sinon, initLogging) {
  var mocks, route, instance;

  registerSuite({
    name: 'routes/post-metrics',

    setup: function () {
      mocks = {
        activityEvent: sinon.spy(),
        config: {
          get: sinon.spy(function () {
            return false;
          })
        },
        gaCollector: {
          write: sinon.spy()
        },
        metricsCollector: {
          write: sinon.spy()
        },
        mozlog: {
          error: sinon.spy()
        },
        statsdCollector: {
          init: sinon.spy(),
          write: sinon.spy()
        }
      };
      route = proxyquire(
        path.join(process.cwd(), 'server/lib/routes/post-metrics'), {
          '../activity-event': mocks.activityEvent,
          '../configuration': mocks.config,
          '../ga-collector': function () {
            return mocks.gaCollector;
          },
          '../metrics-collector-stderr':  function () {
            return mocks.metricsCollector;
          },
          '../statsd-collector': function () {
            return mocks.statsdCollector;
          },
          'mozlog': function () {
            return mocks.mozlog;
          }
        }
      );
    },

    'route interface is correct': function () {
      assert.isFunction(route);
      assert.lengthOf(route, 0);
    },

    'initialise route': {
      setup: function () {
        instance = route();
      },

      'instance interface is correct': function () {
        assert.isObject(instance);
        assert.lengthOf(Object.keys(instance), 3);
        assert.equal(instance.method, 'post');
        assert.equal(instance.path, '/metrics');
        assert.isFunction(instance.process);
        assert.lengthOf(instance.process, 2);
      },

      'route.process': {
        setup: function () {
          setupMetricsHandlerTests({
            data: {
              flowBeginTime: 42,
              flowId: 'qux',
              isSampledUser: true
            },
            events: [ 'foo', 'bar', 'flow.begin', 'baz' ],
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:47.0) Gecko/20100101 Firefox/47.0'
          });
        },

        'response.json was called correctly': function () {
          assert.equal(mocks.response.json.callCount, 1);
          var args = mocks.response.json.args[0];
          assert.lengthOf(args, 1);
          assert.isObject(args[0]);
          assert.lengthOf(Object.keys(args[0]), 1);
          assert.strictEqual(args[0].success, true);
        },

        'process.nextTick was called correctly': function () {
          assert.equal(mocks.nextTick.callCount, 1);
          var args = mocks.nextTick.args[0];
          assert.lengthOf(args, 1);
          assert.isFunction(args[0]);
        },

        'process.nextTick callback': {
          setup: function () {
            mocks.nextTick.args[0][0]();
          },

          'mozlog.error was not called': function () {
            assert.strictEqual(mocks.mozlog.error.callCount, 0);
          },

          'metricsCollector.write was called correctly': function () {
            assert.strictEqual(mocks.metricsCollector.write.callCount, 1);

            var args = mocks.metricsCollector.write.args[0];
            assert.lengthOf(args, 1);
            assert.equal(args[0], mocks.request.body);
            assert.lengthOf(Object.keys(args[0]), 5);

            assert.equal(args[0].agent, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:47.0) Gecko/20100101 Firefox/47.0');
            assert.isArray(args[0].events);
            assert.equal(JSON.stringify(args[0].events), '[{"type":"foo"},{"type":"bar"},{"type":"flow.begin"},{"type":"baz"}]');
            assert.equal(args[0].flowId, 'qux');
            assert.equal(args[0].flowBeginTime, 42);
            assert.strictEqual(args[0].isSampledUser, true);
          },

          'statsdCollector.write was called correctly': function () {
            assert.strictEqual(mocks.statsdCollector.write.callCount, 1);
            var args = mocks.statsdCollector.write.args[0];
            assert.lengthOf(args, 1);
            assert.equal(args[0], mocks.request.body);
          },

          'gaCollector.write was called correctly': function () {
            assert.strictEqual(mocks.gaCollector.write.callCount, 1);
            var args = mocks.gaCollector.write.args[0];
            assert.lengthOf(args, 1);
            assert.equal(args[0], mocks.request.body);
          },

          'activityEvent was called correctly': function () {
            assert.strictEqual(mocks.activityEvent.callCount, 1);
            var args = mocks.activityEvent.args[0];
            assert.lengthOf(args, 3);
            assert.equal(args[0], 'flow.begin');
            assert.isObject(args[1]);
            assert.lengthOf(Object.keys(args[1]), 3);
            assert.equal(args[1].flow_id, 'qux');
            assert.strictEqual(args[1].flow_time, 0);
            assert.equal(args[1].time, 42);
            assert.equal(args[2], mocks.request);
          }
        }
      },

      'route.process without flow.begin event': {
        setup: function () {
          setupMetricsHandlerTests({
            data: {
              flowBeginTime: 42,
              flowId: 'qux',
              isSampledUser: true
            },
            events: [ 'foo', 'bar', 'baz' ],
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:47.0) Gecko/20100101 Firefox/47.0'
          });
        },

        'response.json was called': function () {
          assert.equal(mocks.response.json.callCount, 1);
        },

        'process.nextTick was called': function () {
          assert.equal(mocks.nextTick.callCount, 1);
        },

        'process.nextTick callback': {
          setup: function () {
            mocks.nextTick.args[0][0]();
          },

          'mozlog.error was not called': function () {
            assert.strictEqual(mocks.mozlog.error.callCount, 0);
          },

          'metricsCollector.write was called': function () {
            assert.strictEqual(mocks.metricsCollector.write.callCount, 2);
          },

          'statsdCollector.write was called': function () {
            assert.strictEqual(mocks.statsdCollector.write.callCount, 2);
          },

          'gaCollector.write was called': function () {
            assert.strictEqual(mocks.gaCollector.write.callCount, 2);
          },

          'activityEvent was not called': function () {
            assert.strictEqual(mocks.activityEvent.callCount, 1);
          }
        }
      },

      'route.process without isSampledUser': {
        setup: function () {
          setupMetricsHandlerTests({
            data: {
              flowBeginTime: 42,
              flowId: 'qux'
            },
            events: [ 'foo', 'bar', 'flow.begin', 'baz' ],
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:47.0) Gecko/20100101 Firefox/47.0'
          });
        },

        'response.json was called': function () {
          assert.equal(mocks.response.json.callCount, 1);
        },

        'process.nextTick was called': function () {
          assert.equal(mocks.nextTick.callCount, 1);
        },

        'process.nextTick callback': {
          setup: function () {
            mocks.nextTick.args[0][0]();
          },

          'mozlog.error was not called': function () {
            assert.strictEqual(mocks.mozlog.error.callCount, 0);
          },

          'metricsCollector.write was not called': function () {
            assert.strictEqual(mocks.metricsCollector.write.callCount, 2);
          },

          'statsdCollector.write was not called': function () {
            assert.strictEqual(mocks.statsdCollector.write.callCount, 2);
          },

          'gaCollector.write was called': function () {
            assert.strictEqual(mocks.gaCollector.write.callCount, 3);
          },

          'activityEvent was called': function () {
            assert.strictEqual(mocks.activityEvent.callCount, 2);
          }
        }
      },

      'route.process with text/plain Content-Type': {
        setup: function () {
          setupMetricsHandlerTests({
            contentType: 'text/plain',
            data: {
              flowBeginTime: 77,
              flowId: 'bar',
              isSampledUser: true
            },
            events: [ 'flow.begin', 'foo' ],
            isBodyJSON: true,
            userAgent: 'baz'
          });
        },

        'response.json was called': function () {
          assert.equal(mocks.response.json.callCount, 1);
        },

        'process.nextTick was called': function () {
          assert.equal(mocks.nextTick.callCount, 1);
        },

        'process.nextTick callback': {
          setup: function () {
            mocks.nextTick.args[0][0]();
          },

          'mozlog.error was not called': function () {
            assert.strictEqual(mocks.mozlog.error.callCount, 0);
          },

          'metricsCollector.write was called correctly': function () {
            assert.strictEqual(mocks.metricsCollector.write.callCount, 3);

            var args = mocks.metricsCollector.write.args[2];
            assert.lengthOf(args, 1);
            assert.isObject(args[0]);
            assert.lengthOf(Object.keys(args[0]), 5);

            assert.equal(args[0].agent, 'baz');
            assert.isArray(args[0].events);
            assert.equal(JSON.stringify(args[0].events), '[{"type":"flow.begin"},{"type":"foo"}]');
            assert.equal(args[0].flowId, 'bar');
            assert.equal(args[0].flowBeginTime, 77);
            assert.strictEqual(args[0].isSampledUser, true);
          },

          'statsdCollector.write was called correctly': function () {
            assert.strictEqual(mocks.statsdCollector.write.callCount, 3);
            var args = mocks.statsdCollector.write.args[2];
            assert.lengthOf(args, 1);
            assert.isObject(args[0]);
          },

          'gaCollector.write was called correctly': function () {
            assert.strictEqual(mocks.gaCollector.write.callCount, 4);
            var args = mocks.gaCollector.write.args[3];
            assert.lengthOf(args, 1);
            assert.isObject(args[0]);
          },

          'activityEvent was called correctly': function () {
            assert.strictEqual(mocks.activityEvent.callCount, 3);
            var args = mocks.activityEvent.args[2];
            assert.lengthOf(args, 3);
            assert.equal(args[0], 'flow.begin');
            assert.isObject(args[1]);
            assert.lengthOf(Object.keys(args[1]), 3);
            assert.equal(args[1].flow_id, 'bar');
            assert.strictEqual(args[1].flow_time, 0);
            assert.equal(args[1].time, 77);
            assert.equal(args[2], mocks.request);
          }
        }
      },

      'route.process with text/plain Content-Type and parsed JSON': {
        setup: function () {
          setupMetricsHandlerTests({
            contentType: 'text/plain',
            data: {
              flowBeginTime: 42,
              flowId: 'bar',
              isSampledUser: true
            },
            events: [ 'flow.begin', 'foo' ],
            userAgent: 'baz'
          });
        },

        'response.json was called': function () {
          assert.equal(mocks.response.json.callCount, 1);
        },

        'process.nextTick was called': function () {
          assert.equal(mocks.nextTick.callCount, 1);
        },

        'process.nextTick callback': {
          setup: function () {
            mocks.nextTick.args[0][0]();
          },

          'mozlog.error was called correctly': function () {
            assert.strictEqual(mocks.mozlog.error.callCount, 1);
            var args = mocks.mozlog.error.args[0];
            assert.lengthOf(args, 1);
            assert.instanceOf(args[0], Error);
          },

          'metricsCollector.write was not called': function () {
            assert.strictEqual(mocks.metricsCollector.write.callCount, 3);
          },

          'statsdCollector.write was not called': function () {
            assert.strictEqual(mocks.statsdCollector.write.callCount, 3);
          },

          'gaCollector.write was not called': function () {
            assert.strictEqual(mocks.gaCollector.write.callCount, 4);
          },

          'activityEvent was not called': function () {
            assert.strictEqual(mocks.activityEvent.callCount, 3);
          }
        }
      }
    }
  });

  function setupMetricsHandlerTests (options) {
    options = options || {};
    mocks.request = {
      body: {},
      get: sinon.spy(function (header) {
        switch (header.toLowerCase()) {
        case 'content-type':
          return options.contentType || 'application/json';
        case 'user-agent':
          return options.userAgent;
        }
        return '';
      })
    };
    if (options.events) {
      mocks.request.body.events = _.map(options.events, function (event) {
        return { type: event };
      });
    }
    if (options.data) {
      _.assign(mocks.request.body, options.data);
    }
    if (options.isBodyJSON) {
      mocks.request.body = JSON.stringify(mocks.request.body);
    }
    mocks.response = { json: sinon.spy() };
    mocks.nextTick = sinon.spy();
    var nextTickCopy = process.nextTick;
    process.nextTick = mocks.nextTick;
    instance.process(mocks.request, mocks.response);
    process.nextTick = nextTickCopy;
  }
});

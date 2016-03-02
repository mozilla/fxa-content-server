/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!bluebird',
  'intern/dojo/node!path',
  'intern/dojo/node!proxyquire',
  'intern/dojo/node!sinon',
], function (registerSuite, assert, Promise, path, proxyquire, sinon) {
  var request, info, mozlog, activityEvent, random;

  registerSuite({
    name: 'activity-event',

    setup: function () {
      request = {
        headers: { 'user-agent': 'foo' },
        query: {
          bar: 'baz',
          qux: 'wibble',
          zignore: 'ignore me'
        }
      };
    },

    'sample rate is 100%': {
      setup: function () {
        info = sinon.spy();
        mozlog = {
          config: sinon.spy(function () {
            return { info: info };
          })
        };
        activityEvent = proxyquire(path.resolve('server/lib/activity-event'), {
          './configuration': {
            get: function (property) {
              if (property !== 'activity_events.sample_rate') {
                throw new Error('Bad property `' + property + '` in mock config.get');
              }
              return 1;
            }
          },
          mozlog: mozlog
        });
      },

      'interface is correct': function () {
        assert.isFunction(activityEvent);
        assert.lengthOf(activityEvent, 4);
      },

      'mozlog.config was called correctly': function () {
        assert.equal(mozlog.config.callCount, 1);
        var args = mozlog.config.args[0];
        assert.lengthOf(args, 1);
        assert.isObject(args[0]);
        assert.lengthOf(Object.keys(args[0]), 3);
        assert.equal(args[0].app, 'fxa-content-server');
        assert.equal(args[0].stream, process.stderr);
        assert.equal(args[0].format, 'heka');
      },

      'call activityEvent': {
        setup: function () {
          activityEvent('mock event', { a: 'b', c: 'd' }, request, [ 'bar', 'qux' ]);
          return new Promise(function (resolve) {
            setImmediate(function () {
              resolve();
            });
          });
        },

        'log.info was called correctly': function () {
          assert.equal(info.callCount, 1);

          var args = info.args[0];
          assert.lengthOf(args, 2);

          assert.equal(args[0], 'activityEvent');

          assert.isObject(args[1]);
          assert.lengthOf(Object.keys(args[1]), 6);
          assert.equal(args[1].event, 'mock event');
          assert.equal(args[1].userAgent, 'foo');
          assert.equal(args[1].bar, 'baz');
          assert.equal(args[1].qux, 'wibble');
          assert.equal(args[1].a, 'b');
          assert.equal(args[1].c, 'd');
        }
      }
    },

    'sample rate is 50%': {
      setup: function () {
        info = sinon.spy();
        mozlog = {
          config: sinon.spy(function () {
            return { info: info };
          })
        };
        activityEvent = proxyquire(path.resolve('server/lib/activity-event'), {
          './configuration': {
            get: function (property) {
              if (property !== 'activity_events.sample_rate') {
                throw new Error('Bad property `' + property + '` in mock config.get');
              }
              return 0.5;
            }
          },
          mozlog: mozlog
        });
        random = Math.random;
        var count = 0;
        Math.random = sinon.spy(function () {
          if (++count % 2 === 1) {
            return 0.4;
          }
          return 0.5;
        });
        for (var i = 0; i < 6; ++i) {
          activityEvent('bar', {}, request);
        }
        return new Promise(function (resolve) {
          setImmediate(function () {
            resolve();
          });
        });
      },

      teardown: function () {
        Math.random = random;
      },

      'Math.random was called 6 times': function () {
        assert.equal(Math.random.callCount, 6);
      },

      'log.info was called 3 times': function () {
        assert.equal(info.callCount, 3);
      }
    },

    'sample rate is 1%': {
      setup: function () {
        info = sinon.spy();
        mozlog = {
          config: sinon.spy(function () {
            return { info: info };
          })
        };
        activityEvent = proxyquire(path.resolve('server/lib/activity-event'), {
          './configuration': {
            get: function (property) {
              if (property !== 'activity_events.sample_rate') {
                throw new Error('Bad property `' + property + '` in mock config.get');
              }
              return 0.01;
            }
          },
          mozlog: mozlog
        });
        random = Math.random;
        var count = 0;
        Math.random = sinon.spy(function () {
          if (++count % 100 === 1) {
            return 0.009;
          }
          return 0.01;
        });
        for (var i = 0; i < 101; ++i) {
          activityEvent('bar', {}, request);
        }
        return new Promise(function (resolve) {
          setImmediate(function () {
            resolve();
          });
        });
      },

      teardown: function () {
        Math.random = random;
      },

      'Math.random was called 101 times': function () {
        assert.equal(Math.random.callCount, 101);
      },

      'log.info was called twice': function () {
        assert.equal(info.callCount, 2);
      }
    }
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!bluebird',
  'intern/dojo/node!path',
  'intern/dojo/node!sinon',
  'intern/dojo/node!../../../server/lib/routes/get-400',
], function (registerSuite, assert, Promise, path, sinon, route) {
  var config, instance, request, response;

  registerSuite({
    name: 'routes/get-400',

    'route interface is correct': function () {
      assert.isFunction(route);
      assert.lengthOf(route, 1);
    },

    'initialise route': {
      setup: function () {
        config = {
          get: sinon.spy(function () {
            return 'foo';
          })
        };
        instance = route(config);
      },

      'instance interface is correct': function () {
        assert.isObject(instance);
        assert.lengthOf(Object.keys(instance), 3);
        assert.equal(instance.method, 'get');
        assert.equal(instance.path, '/400.html');
        assert.isFunction(instance.process);
        assert.lengthOf(instance.process, 2);
      },

      'route.process with `message` cookie set': {
        setup: function () {
          request = {
            cookies: {
              'message': 'Invalid parameter: email'
            },
            gettext: function (msg) {
              return msg;
            }
          };
          response = {
            clearCookie: sinon.spy(),
            removeHeader: sinon.spy(),
            render: sinon.spy()
          };
          instance.process(request, response);
        },

        'x-frame-options headers are removed': function () {
          assert.isTrue(response.removeHeader.calledOnce);
          assert.isTrue(response.removeHeader.calledWith('x-frame-options'));
        },

        'the message cookie is cleared': function () {
          assert.isTrue(response.clearCookie.calledOnce);
          assert.isTrue(response.clearCookie.calledWith('message', { path: '/400.html' }));
        },

        'response.render was called correctly': function () {
          assert.equal(response.render.callCount, 1);

          var args = response.render.args[0];
          assert.lengthOf(args, 2);

          assert.equal(args[0], '400');

          assert.isObject(args[1]);
          assert.lengthOf(Object.keys(args[1]), 2);
          assert.equal(args[1].message, 'Invalid parameter: email');
          assert.equal(args[1].staticResourceUrl, 'foo');
        }
      },

      'route.process without `message` cookie set': {
        setup: function () {
          request = {
            cookies: {
            },
            gettext: function (msg) {
              return msg;
            }
          };
          response = {
            clearCookie: sinon.spy(),
            removeHeader: sinon.spy(),
            render: sinon.spy()
          };
          instance.process(request, response);
        },

        'response.render was called correctly': function () {
          assert.equal(response.render.callCount, 1);

          var args = response.render.args[0];
          assert.lengthOf(args, 2);

          assert.equal(args[0], '400');

          assert.isObject(args[1]);
          assert.lengthOf(Object.keys(args[1]), 2);
          assert.equal(args[1].message, 'Unexpected error');
          assert.equal(args[1].staticResourceUrl, 'foo');
        }
      }
    }
  });
});

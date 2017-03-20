/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../../server/lib/configuration',
  'intern/dojo/node!got',
  'intern/dojo/node!fs',
  'intern/dojo/node!mozlog',
  'intern/dojo/node!path',
  'intern/dojo/node!proxyquire',
  'intern/dojo/node!sinon',
  'intern/dojo/node!url'
], function (intern, registerSuite, assert, config, got, fs, path, proxyquire, sinon, url) {

  var suite = {
    name: 'verify_email'
  };

  var logger = {
    error: sinon.stub()
  };

  suite['#post /verify_email - returns ValidationError without query params'] = function () {

    var mocks = {
      mozlog: function() {
        return logger;
      }
    };

    var verifyEmail = proxyquire(path.join(process.cwd(), 'server', 'lib', 'routes', 'get-verify-email'), mocks);
    var route = verifyEmail().process;

    var req = {
      query: {
        code: '',
        uid: ''
      }
    };
    var res = {
      json: function () {}
    };

    var next = function () {
      assert.equal(logger.error.callCount, 1);
    };

    route(req, res, next);
  };


  suite['#post /verify_email - returns 200 status'] = function () {

    var mocks = {
      'got': {
        post: function (req, res, next) {
          return new Promise( function (resolve, reject) {
            resolve({
              'statusCode': 200,
              'statusMessage': 'OK'
            });
          });
        }
      },
      mozlog: function() {
        return logger;
      }
    };

    var verifyEmail = proxyquire(path.join(process.cwd(), 'server', 'lib', 'routes', 'get-verify-email'), mocks);
    var route = verifyEmail().process;

    var req = {
      query: {
        code: '12345678912345678912345678912312',
        uid: '12345678912345678912345678912312'
      }
    };
    var res = {
      json: function () {}
    };

    var next = function () {
      assert.equal(logger.error.callCount, 0);
    };

    route(req, res, next);
  };

  suite['#post /verify_email - returns 400 status'] = function () {

    var mocks = {
      'got': {
        post: function (req, res, next) {
          return new Promise( function (resolve, reject) {
            reject({
              'host': '127.0.0.1:9000',
              'hostname': '127.0.0.1',
              'message': 'Response code 400 (Bad Request)',
              'method': 'POST',
              'path': '/v1/recovery_email/verify_code',
              'statusCode': 400,
              'statusMessage': 'Bad Request'
            });
          });
        }
      },
      mozlog: function() {
        return logger;
      }
    };

    var verifyEmail = proxyquire(path.join(process.cwd(), 'server', 'lib', 'routes', 'get-verify-email'), mocks);
    var route = verifyEmail().process;

    var req = {
      query: {
        code: '12345678912345678912345678912312',
        uid: '12345678912345678912345678912312'
      }
    };
    var res = {
      json: function () {}
    };

    var next = function () {
      assert.equal(logger.error.callCount, 1);
    };

    route(req, res, next);
  };

  registerSuite(suite);

});

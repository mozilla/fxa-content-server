/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// test the metrics library

define([
  'chai',
  'sinon',
  'jquery',
  'lib/newsletter'
],
function (chai, sinon, $, Newsletter) {
  'use strict';

  /*global describe, it*/
  var assert = chai.assert;

  describe('lib/newsletter', function () {
    var requests, xhr;
    beforeEach(function () {
      requests = [];
      xhr = sinon.useFakeXMLHttpRequest();
      xhr.onCreate = function (xhr) {
        requests.push(xhr);
      };
    });

    afterEach(function () {
      xhr.restore();
    });

    describe('signUp', function () {
      it('resolves on success', function () {
        var promise = Newsletter.signUp('testuser@testuser.com')
          .then(function (data) {
            assert.equal(data.success, true);
          });

        requests[0].respond(200, { 'Content-Type': 'application/json' },
                                '{"success":true}');

        return promise;
      });

      it('rejects on failure', function () {
        var promise = Newsletter.signUp('testuser@testuser.com')
          .then(function (data) {
            assert.fail();
          }, function (err) {
            assert.equal(err, 'Internal Server Error');
          });

        requests[0].respond(500, { 'Content-Type': 'application/json' },
                                '{"reason":"invalid email"}');

        return promise;
      });
    });
  });
});

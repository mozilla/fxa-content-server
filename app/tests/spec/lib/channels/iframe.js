/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
  'chai',
  'sinon',
  'lib/channels/iframe',
  'lib/auth-errors',
  '../../../mocks/window',
  '../../../lib/helpers'
],
function (chai, sinon, IFrameChannel, AuthErrors, WindowMock, TestHelpers) {
  var channel, windowMock;

  var wrapAssertion = TestHelpers.wrapAssertion;
  var assert = chai.assert;
  var IFRAMED_ORIGIN = 'https://iframed_rp.org';

  function pingResponse(msg, targetOrigin) {
    var components = msg.split('!!!');
    var command = components[0];

    if (command === 'ping') {
      assert.equal(targetOrigin, '*');
      windowMock.trigger('message', {
        data: msg,
        origin: IFRAMED_ORIGIN
      });
    }
  }

  describe('lib/channel/iframe', function () {
    beforeEach(function() {
      windowMock = new WindowMock();
      windowMock.parent = new WindowMock();

      channel = new IFrameChannel();
      return channel.init({
        window: windowMock,
        sendTimeoutLength: 1
      });
    });

    afterEach(function () {
      channel.teardown();
    });

    describe('send', function () {
      it('sends a message to the parent and waits for a response', function(done) {
        windowMock.parent.postMessage = pingResponse;

        channel.send('ping', { key: 'value' }, function (err, response) {
          wrapAssertion(function () {
            assert.isNull(err);
            assert.equal(response.key, 'value');
          }, done);
        });
      });

      it('times out if there is no response', function (done) {
        // drop the message on the ground.
        windowMock.parent.postMessage = function() {};

        channel.send('ping', null, function (err) {
          wrapAssertion(function () {
            assert.isTrue(AuthErrors.is(err, 'UNEXPECTED_ERROR'));
          }, done);
        });
      });

      describe('the `check_environment` message', function () {
        var mockServer;
        var CHECK_ALLOWED_URL = '/iframe_allowed/' + encodeURIComponent(IFRAMED_ORIGIN);

        beforeEach(function () {
          mockServer = sinon.fakeServer.create();
          mockServer.autoRespond = true;
        });

        afterEach(function () {
          mockServer.restore();
        });

        it('returns an error if the origin is not allowed to be framed', function (done) {
          windowMock.parent.postMessage = pingResponse;

          mockServer.respondWith('GET', CHECK_ALLOWED_URL,
            [200, { 'Content-Type': 'application/json' },
              JSON.stringify({ isIframeAllowed: false })]);

          channel.teardown();
          channel = new IFrameChannel();
          channel.init({
            window: windowMock,
            sendTimeoutLength: 1
          });

          channel.send('check_environment', null, function (err, response) {
            wrapAssertion(function () {
              assert.isTrue(AuthErrors.is(err, 'ILLEGAL_IFRAME_PARENT'));
            }, done);
          });
        });

        it('returns no error if origin is allowed to be framed', function (done) {
          windowMock.parent.postMessage = pingResponse;

          mockServer.respondWith('GET', CHECK_ALLOWED_URL,
            [200, { 'Content-Type': 'application/json' },
              JSON.stringify({ isIframeAllowed: true })]);

          channel.teardown();
          channel = new IFrameChannel();
          channel.init({
            window: windowMock,
            sendTimeoutLength: 1
          });

          channel.send('check_environment', null, function (err, response) {
            wrapAssertion(function () {
              assert.isNull(err);
            }, done);
          });
        });

        it('returns an `UNEXPECTED_ERROR` if there is no response from the parent', function (done) {
          // drop the message on the ground.
          windowMock.parent.postMessage = function() {};

          channel.send('check_environment', null, function (err, response) {
            wrapAssertion(function () {
              assert.isTrue(AuthErrors.is(err, 'UNEXPECTED_ERROR'));
            }, done);
          });
        });
      });
    });
  });
});

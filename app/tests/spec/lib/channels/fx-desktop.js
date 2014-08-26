/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
  'chai',
  '/tests/mocks/window.js',
  'lib/session',
  'lib/channels/fx-desktop',
  'lib/auth-errors',
  '/tests/lib/helpers.js'
],
function (chai, WindowMock, Session, FxDesktopChannel, AuthErrors, TestHelpers) {
  /*global describe, beforeEach, afterEach, it*/
  var assert = chai.assert;
  var channel;
  var wrapAssertion = TestHelpers.wrapAssertion;

  describe('lib/channel/fx-desktop', function () {
    var windowMock;

    function dispatchEvent(status, data) {
      windowMock.dispatchEvent({
        detail: {
          command: 'message',
          data: {
            status: status,
            data: data
          }
        }
      });
    }

    beforeEach(function () {
      windowMock = new WindowMock();

      channel = new FxDesktopChannel();
      channel.init({
        window: windowMock,
        sendTimeoutLength: 10
      });
    });

    afterEach(function () {
      if (channel) {
        channel.teardown();
      }
    });

    describe('send', function () {
      it('sends a whitelisted message to the browser', function () {
        channel.send('session_status', { key: 'value' });
        assert.isTrue(windowMock.dispatchedEvents['session_status']);
      });


      it('times out if browser does not respond', function (done) {
        channel.send('can_link_account', { key: 'value' }, function (err) {
          wrapAssertion(function () {
            assert.isTrue(AuthErrors.is(err, 'UNEXPECTED_ERROR'));
          }, done);
        });
      });

      it('does not except on timeout if callback is not given', function (done) {
        // if there is an exception, done is never called.
        setTimeout(done, 500);
        channel.send('can_link_account', { key: 'value' });
      });
    });

    describe('on', function () {
      it('registers a callback to be called when the browser sends ' +
            'the registered message', function (done) {

        channel.on('call-the-callback', function () {
          done();
        });

        dispatchEvent('call-the-callback');
      });
    });
  });
});



/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
    'underscore',
    'chai',
    'router',
    'views/sign_in',
    'lib/channels/web',
    '/tests/mocks/window.js',
    'lib/session'
  ],
  function (_, chai, Router, View, WebChannel, WindowMock, Session) {
    /*global describe, beforeEach, it*/
    var assert = chai.assert;
    var channel;
    var windowMock;

    describe('lib/channel/web', function () {

      beforeEach(function () {
        windowMock = new WindowMock();
        channel = new WebChannel();
        channel.init({
          window: windowMock
        });
      });

      describe('send', function () {
        it('sends an event with a callback', function () {
          channel.send('after_render', {}, _.bind(function (err, response) {
              assert.notOk(err);
            }, this)
          );
          assert.isTrue(windowMock.dispatchedEvents['after_render']);
        });

        it('sends an event', function () {
          try {
            channel.send('after_render');
          } catch (e) {
            assert.notOk(e);
          }
          assert.isTrue(windowMock.dispatchedEvents['after_render']);
        });
      });

      describe('after_render event', function () {
        it('works with dispatchedEvents', function () {
          channel.send('after_render');
          assert.isTrue(windowMock.dispatchedEvents['after_render']);
        });

        it('works with a view', function (done) {
          var router = new Router({
            window: windowMock,
            channel: channel
          });

          var signInView = new View({
            window: windowMock
          });

          router.showView(signInView).then(function() {
            assert.isTrue(windowMock.dispatchedEvents['after_render']);
            done();
          });

        });

      });
    });
  });



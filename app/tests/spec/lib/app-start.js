/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
  'chai',
  'sinon',
  'lib/app-start',
  'lib/session',
  'lib/constants',
  'lib/promise',
  'lib/auth-errors',
  '../../mocks/window',
  '../../mocks/router',
  '../../mocks/history',
  '../../mocks/channel'
],
function (chai, sinon, AppStart, Session, Constants, p, AuthErrors,
      WindowMock, RouterMock, HistoryMock, ChannelMock) {
  /*global describe, beforeEach, it*/
  var assert = chai.assert;

  describe('lib/app-start', function () {
    var windowMock;
    var routerMock;
    var historyMock;
    var appStart;


    function getFxDesktopContextSearchString() {
      return '?context=' + Constants.FX_DESKTOP_CONTEXT;
    }

    function dispatchEventFromWindowMock(status, data) {
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
      // force the normal NullChannel to be produced.
      windowMock.top = windowMock;

      routerMock = new RouterMock();
      historyMock = new HistoryMock();
    });

    describe('default channel choice', function () {
      beforeEach(function () {
        appStart = new AppStart({
          window: windowMock,
          router: routerMock,
          history: historyMock
        });
      });

      it('starts the app', function () {
        return appStart.startApp()
                    .then(function () {
                      assert.ok(Session.config);

                        // translator is put on the global object.
                      assert.ok(windowMock.translator);
                    });
      });

      it('redirects to /cookies_disabled if localStorage is disabled', function () {

        var fakeServer = sinon.fakeServer.create();
        fakeServer.autoRespond = true;
        fakeServer.respondWith('/config',
            [200, { 'Content-Type': 'application/json' },
            JSON.stringify({
              localStorageEnabled: false,
              i18n: {
                supportedLanguages: ['en'],
                defaultLang: 'en'
              }
            })]);

        return appStart.startApp()
            .then(function () {
              assert.equal(routerMock.page, 'cookies_disabled');
              fakeServer.restore();
            });
      });

      it('sets the session service from a client_id query parameter', function () {
        windowMock.location.search = '?client_id=testing';
        return appStart.startApp()
                    .then(function () {
                      assert.equal(Session.service, 'testing');
                    });
      });

      it('redirects to /settings if the context is FXA_DESKTOP and user is signed in', function () {
        windowMock.location.search = getFxDesktopContextSearchString();

        windowMock.on('session_status', function () {
          dispatchEventFromWindowMock('session_status', {
            email: 'testuser@testuser.com'
          });
        });

        return appStart.startApp()
            .then(function () {
              assert.equal(routerMock.page, 'settings');
            });
      });

      it('redirects to /signup if the context is FXA_DESKTOP, no email is set, and no pathname is specified', function () {
        windowMock.location.search = getFxDesktopContextSearchString();

        windowMock.on('session_status', function () {
          // no data from session_status signifies no user is signed in.
          dispatchEventFromWindowMock('session_status');
        });

        return appStart.startApp()
            .then(function () {
              assert.equal(routerMock.page, 'signup');
            });
      });

      it('does not redirect the user if a route is present in the path', function () {
        windowMock.location.search = getFxDesktopContextSearchString();
        windowMock.location.pathname = '/signin';
        routerMock.page = 'signin';

        windowMock.on('session_status', function () {
          // no data from session_status signifies no user is signed in.
          dispatchEventFromWindowMock('session_status');
        });

        return appStart.startApp()
            .then(function () {
              assert.equal(routerMock.page, 'signin');
            });
      });

      it('sets the session service from a client_id query parameter', function () {
        windowMock.location.search = '?client_id=testing';
        return appStart.startApp()
                    .then(function () {
                      assert.equal(Session.service, 'testing');
                    });
      });
    });

    describe('queryChannel with `check_environment`', function () {
      var channelMock;

      beforeEach(function () {
        channelMock = new ChannelMock();

        appStart = new AppStart({
          window: windowMock,
          router: routerMock,
          history: historyMock,
          channel: channelMock
        });
      });

      describe('when `check_environment` throws an ILLEGAL_IFRAME_PARENT error', function () {
        it('redirects to /illegal_iframe', function () {
          channelMock.send = function(command, data, done) {
            if (command === 'check_environment') {
              done(AuthErrors.toError('ILLEGAL_IFRAME_PARENT'));
            }
            done();
          };

          return appStart.startApp()
              .then(function () {
                assert.equal(routerMock.page, 'illegal_iframe');
              });
          });
      });

      describe('when channel.init throws an COOKIES_DISABLED error', function () {
        it('redirects to /cookies_disabled', function () {
          channelMock.send = function(command, data, done) {
            if (command === 'check_environment') {
              done(AuthErrors.toError('COOKIES_DISABLED'));
            }
            done();
          };

          return appStart.startApp()
              .then(function () {
                assert.equal(routerMock.page, 'cookies_disabled');
              });
          });
      });

      describe('when channel.init throws an unexpected error', function () {
        it('redirects to /unexpected_error', function () {
          channelMock.send = function(command, data, done) {
            if (command === 'check_environment') {
              done(AuthErrors.toError('INVALID_JSON'));
            }
            done();
          };

          return appStart.startApp()
              .then(function () {
                assert.equal(routerMock.page, 'unexpected_error');
              });
        });
      });
    });
  });
});



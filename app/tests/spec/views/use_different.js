/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
  'chai',
  'jquery',
  'views/use_different',
  'lib/session',
  'lib/fxa-client',
  'models/reliers/relier',
  '../../mocks/window'
],
function (chai, $, View, Session, FxaClient, Relier, WindowMock) {
  var assert = chai.assert;

  describe('/views/use_different', function () {
    describe('missing email address', function () {
      var view;
      var windowMock;
      var fxaClient;
      var relier;

      beforeEach(function () {
        windowMock = new WindowMock();
        windowMock.location.search = '';

        relier = new Relier();
        fxaClient = new FxaClient({
          relier: relier
        });

        Session.clear();
        view = new View({
          window: windowMock,
          fxaClient: fxaClient,
          relier: relier
        });
        return view.render()
            .then(function () {
              $('#container').html(view.el);
            });
      });

      afterEach(function () {
        view.remove();
        view.destroy();
        windowMock = view = null;
      });

      describe('render', function () {
        it('does not prefill email and password if stored in Session', function () {
          Session.set('prefillEmail', 'testuser@testuser.com');
          Session.set('prefillPassword', 'prefilled password');
          return view.render()
              .then(function () {
                assert.ok($('#fxa-signin-header').length);
                assert.equal(view.$('[type=email]').val(), '');
                assert.equal(view.$('[type=password]').val(), '');
              });
        });
      });

    });
  });
});



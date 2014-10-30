/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';


define([
  'chai',
  'sinon',
  'lib/session',
  'lib/promise',
  'lib/oauth-client',
  'lib/assertion',
  'models/reliers/relier',
  'models/brokers/oauth'
],
function (chai, sinon, Session, p, OAuthClient, Assertion, Relier, OAuthBroker) {
  var assert = chai.assert;

  var BASE_REDIRECT_URL = 'http://127.0.0.1:8080/api/oauth';
  var GET_CODE_REDIRECT_URL = 'https://127.0.0.1:8080?code=code&state=state';

  describe('models/brokers/oauth', function () {
    var broker;
    var oAuthClient;
    var assertionLibrary;
    var relier;

    beforeEach(function () {
      oAuthClient = new OAuthClient();
      sinon.stub(oAuthClient, 'getCode', function () {
        return p({
          redirect: GET_CODE_REDIRECT_URL
        });
      });

      assertionLibrary = new Assertion({});
      sinon.stub(assertionLibrary, 'generate', function () {
        return p('assertion');
      });

      relier = new Relier();
      relier.set({
        webChannelId: 'webChannelId',
        clientId: 'clientId',
        state: 'state',
        scope: 'scope',
        action: 'action'
      });


      broker = new OAuthBroker({
        session: Session,
        assertionLibrary: assertionLibrary,
        oAuthClient: oAuthClient,
        oAuthUrl: BASE_REDIRECT_URL,
        relier: relier
      });
    });

    describe('finishOAuthFlow', function () {
      it('must be overridden', function () {
        return broker.finishOAuthFlow()
          .then(assert.fail, function (err) {
            assert.ok(err);
          });
      });
    });

    describe('afterSignIn', function () {
      it('calls finishOAuthFlow with the correct options', function () {
        sinon.stub(broker, 'finishOAuthFlow', function () {
          return p();
        });

        return broker.afterSignIn()
          .then(function () {
            assert.isTrue(broker.finishOAuthFlow.calledWith({
              redirect:  GET_CODE_REDIRECT_URL,
              state: 'state',
              code: 'code'
            }, 'signin'));
          });
      });
    });

    describe('beforeSignUpConfirmed', function () {
      it('saves OAuth params to session', function () {
        return broker.beforeSignUpConfirmed()
          .then(function () {
            assert.ok(!! Session.oauth);
          });
      });
    });

    describe('afterSignUpConfirmed', function () {
      it('calls finishOAuthFlow with the correct options', function () {
        sinon.stub(broker, 'finishOAuthFlow', function () {
          return p();
        });

        return broker.afterSignUpConfirmed()
          .then(function () {
            assert.isTrue(broker.finishOAuthFlow.calledWith({
              redirect:  GET_CODE_REDIRECT_URL,
              state: 'state',
              code: 'code'
            }, 'signup'));
          });
      });
    });

    describe('afterSignUpVerified', function () {
      it('for future use', function () {
        sinon.spy(broker, 'finishOAuthFlow');

        return broker.afterSignUpVerified();
      });
    });

    describe('beforeResetPasswordConfirmed', function () {
      it('saves OAuth params to session', function () {
        return broker.beforeResetPasswordConfirmed()
          .then(function () {
            assert.ok(!! Session.oauth);
          });
      });
    });


    describe('afterResetPasswordConfirmed', function () {
      it('calls finishOAuthFlow with the expected options', function () {
        sinon.stub(broker, 'finishOAuthFlow', function () {
          return p();
        });

        return broker.afterResetPasswordConfirmed()
          .then(function () {
            assert.isTrue(broker.finishOAuthFlow.calledWith({
              redirect:  GET_CODE_REDIRECT_URL,
              state: 'state',
              code: 'code'
            }, 'reset_password'));
          });
      });
    });

    describe('getOAuthResult', function () {
      it('gets an object with the OAuth login information', function () {
        return broker.getOAuthResult()
          .then(function (result) {
            assert.equal(result.redirect, GET_CODE_REDIRECT_URL);
            assert.equal(result.state, 'state');
            assert.equal(result.code, 'code');
          });
      });

      it('passes on errors from assertion generation', function () {
        assertionLibrary.generate.restore();
        sinon.stub(assertionLibrary, 'generate', function () {
          return p.reject(new Error('uh oh'));
        });

        return broker.getOAuthResult()
          .then(assert.fail, function (err) {
            assert.equal(err.message, 'uh oh');
          });
      });

      it('passes on errors from oAuthClient.getCode', function () {
        oAuthClient.getCode.restore();
        sinon.stub(oAuthClient, 'getCode', function () {
          return p.reject(new Error('uh oh'));
        });

        return broker.getOAuthResult()
          .then(assert.fail, function (err) {
            assert.equal(err.message, 'uh oh');
          });
      });
    });

    describe('transformLink', function () {
      it('prepends `/oauth` to the link', function () {
        var transformed = broker.transformLink('/signin');
        assert.equal(transformed, '/oauth/signin');
      });
    });
  });
});



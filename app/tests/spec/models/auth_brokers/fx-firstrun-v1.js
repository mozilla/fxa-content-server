/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Account = require('models/account');
  const { assert } = require('chai');
  const FxFirstrunV1AuthenticationBroker = require('models/auth_brokers/fx-firstrun-v1');
  const Metrics = require('lib/metrics');
  const NullChannel = require('lib/channels/null');
  const p = require('lib/promise');
  const Relier = require('models/reliers/relier');
  const sinon = require('sinon');
  const WindowMock = require('../../../mocks/window');

  describe('models/auth_brokers/fx-firstrun-v1', function () {
    let account;
    let broker;
    let channelMock;
    let metrics;
    let iframeChannel;
    let relier;
    let windowMock;

    beforeEach(function () {
      account = new Account({
        email: 'testuser@testuser.com',
        keyFetchToken: 'key-fetch-token',
        unwrapBKey: 'unwrap-b-key'
      });
      channelMock = new NullChannel();
      channelMock.send = sinon.spy(function () {
        return p();
      });
      iframeChannel = new NullChannel();
      metrics = new Metrics();
      relier = new Relier();
      windowMock = new WindowMock();

      broker = new FxFirstrunV1AuthenticationBroker({
        channel: channelMock,
        iframeChannel: iframeChannel,
        metrics,
        relier,
        window: windowMock
      });
    });

    afterEach(() => {
      metrics.destroy();
      metrics = null;
    });

    it('has the `cadAfterSignUpConfirmationPoll` capability by default', function () {
      assert.isTrue(broker.hasCapability('cadAfterSignUpConfirmationPoll'));
    });

    it('has the `signup` capability by default', function () {
      assert.isTrue(broker.hasCapability('signup'));
    });

    it('has the `handleSignedInNotification` capability by default', function () {
      assert.isTrue(broker.hasCapability('handleSignedInNotification'));
    });

    it('has the `emailVerificationMarketingSnippet` capability by default', function () {
      assert.isTrue(broker.hasCapability('emailVerificationMarketingSnippet'));
    });

    describe('afterLoaded', function () {
      it('notifies the iframe channel', function () {
        sinon.spy(iframeChannel, 'send');

        return broker.afterLoaded(account)
          .then(function () {
            assert.isTrue(iframeChannel.send.calledWith(broker._iframeCommands.LOADED));
          });
      });
    });

    describe('afterSignIn', function () {
      let result;

      describe('defaults', function () {
        beforeEach(function () {
          sinon.spy(iframeChannel, 'send');

          return broker.fetch()
            .then(function () {
              return broker.afterSignIn(account);
            })
            .then(function (_result) {
              result = _result;
            });
        });

        it('notifies the web channel, navigates to `signin_confirmed` by default', function () {
          assert.isTrue(channelMock.send.calledWith('fxaccounts:login'));
          assert.equal(result.type, 'navigate');
          assert.equal(result.endpoint, 'signin_confirmed');
        });
      });
    });

    describe('beforeSignUpConfirmationPoll', function () {
      let result;
      beforeEach(function () {
        sinon.spy(iframeChannel, 'send');

        account.set('needsOptedInToMarketingEmail', true);

        return broker.beforeSignUpConfirmationPoll(account)
          .then(function (_result) {
            result = _result;
          });
      });

      it('notifies the iframe channel', function () {
        assert.isTrue(
          iframeChannel.send.calledWith(
            broker._iframeCommands.SIGNUP_MUST_VERIFY, { emailOptIn: true }));
      });

      it('does not halt', function () {
        assert.isUndefined(result.halt);
      });
    });

    describe('afterSignInConfirmationPoll', function () {
      it('notifies the iframe channel', function () {
        sinon.spy(iframeChannel, 'send');

        return broker.afterSignInConfirmationPoll(account)
          .then(function () {
            assert.isTrue(iframeChannel.send.calledWith(broker._iframeCommands.VERIFICATION_COMPLETE));
          });
      });
    });

    describe('afterSignUpConfirmationPoll', function () {
      it('notifies the iframe channel', function () {
        sinon.spy(iframeChannel, 'send');
        sinon.spy(metrics, 'setViewNamePrefix');

        return broker.afterSignUpConfirmationPoll(account)
          .then(() => {
            assert.isTrue(iframeChannel.send.calledOnce);
            assert.isTrue(iframeChannel.send.calledWith(broker._iframeCommands.VERIFICATION_COMPLETE));

            assert.isTrue(metrics.setViewNamePrefix.called);
            assert.isTrue(metrics.setViewNamePrefix.calledWith('signup'));
          });
      });
    });

    describe('afterResetPasswordConfirmationPoll', function () {
      it('notifies the iframe channel, does not halt', function () {
        sinon.spy(iframeChannel, 'send');

        return broker.afterResetPasswordConfirmationPoll(account)
          .then(function (result) {
            assert.isTrue(iframeChannel.send.calledWith(broker._iframeCommands.VERIFICATION_COMPLETE));
            assert.isUndefined(result.halt);
          });
      });
    });
  });
});



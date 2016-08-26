/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const assert = require('chai').assert;
  const Account = require('models/account');
  const AuthErrors = require('lib/auth-errors');
  const Backbone = require('backbone');
  const BaseBroker = require('models/auth_brokers/base');
  const ConfirmationPoll = require('models/confirmation/confirm-sign-in-authorization-poll');
  const Metrics = require('lib/metrics');
  const p = require('lib/promise');
  const Relier = require('models/reliers/relier');
  const Session = require('lib/session');
  const sinon = require('sinon');
  const TestHelpers = require('../../lib/helpers');
  const View = require('views/confirm_sign_in_authorization');
  const WindowMock = require('../../mocks/window');

  describe('views/confirm_sign_in_authorization', () => {
    let account;
    let broker;
    let confirmationPoll;
    let metrics;
    let model;
    let relier;
    let view;
    let windowMock;

    beforeEach(() => {
      metrics = new Metrics();
      model = new Backbone.Model();
      windowMock = new WindowMock();

      relier = new Relier({
        window: windowMock
      });

      broker = new BaseBroker({
        relier: relier,
        window: windowMock
      });

      account = new Account({
        email: 'a@a.com',
        uid: 'uid'
      });

      model.set({
        account: account
      });

      confirmationPoll = new ConfirmationPoll({}, {
        pollIntervalMS: 1
      });

      view = new View({
        broker: broker,
        canGoBack: true,
        confirmationPoll: confirmationPoll,
        metrics: metrics,
        model: model,
        relier: relier,
        viewName: 'confirm-sign-in-authorization',
        window: windowMock
      });

      return view.render()
        .then(() => $('#container').html(view.el));
    });

    afterEach(function () {
      metrics.destroy();

      view.remove();
      view.destroy();

      view = metrics = null;
    });

    describe('render', () => {
      it('renders the view', () => {
        assert.lengthOf($('#fxa-confirm-authorize-signin-header'), 1);
        assert.include(view.$('.verification-email-message').text(), 'a@a.com');
      });
    });

    describe('resend', () => {
      let shouldResend;
      beforeEach(() => {
        sinon.stub(view, 'beforeSubmit', () => p(shouldResend));

        sinon.stub(account, 'sendLoginAuthorizationEmail', () => p());
      });

      describe('should not resend', () => {
        beforeEach(() => {
          shouldResend = false;

          return view.resend();
        });

        it('should not send the authorization email', () => {
          assert.isFalse(account.sendLoginAuthorizationEmail.called);
        });
      });

      describe('should resend', () => {
        beforeEach(() => {
          shouldResend = true;

          return view.resend();
        });

        it('should send the authorization email', () => {
          assert.isTrue(account.sendLoginAuthorizationEmail.called);
        });
      });
    });

    describe('confirm same browser', () => {
      beforeEach(() => {
        sinon.stub(view, 'navigate', sinon.spy());

        confirmationPoll.trigger('confirm-same-browser');
      });

      it('redirects to `signin_authorized`', () => {
        assert.isTrue(view.navigate.calledWith('signin_authorized', {
          account: account
        }));
      });
    });

    describe('confirm different browser', () => {
      beforeEach(() => {
        sinon.stub(view, 'navigate', sinon.spy());

        confirmationPoll.trigger('confirm-different-browser');
      });

      it('redirects to `signin_authorized`', () => {
        assert.isTrue(view.navigate.calledWith('signin'));

        const args = view.navigate.args[0][1];
        assert.ok(args.success);
        assert.equal(args.email, 'a@a.com');
      });
    });

    describe('poll error', () => {
      let pollError = AuthErrors.toError('REQUEST_BLOCKED');

      beforeEach(() => {
        sinon.spy(confirmationPoll, 'stop');
        sinon.spy(view, 'displayError');

        confirmationPoll.trigger('error', pollError);
      });

      it('displays the error and stops the poll', () => {
        assert.isTrue(view.displayError.calledWith(pollError));
        assert.isTrue(confirmationPoll.stop.called);
      });
    });
  });
});

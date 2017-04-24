/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const { assert } = require('chai');
  const KeyCodes = require('lib/key-codes');
  const Metrics = require('lib/metrics');
  const Notifier = require('lib/channels/notifier');
  const p = require('lib/promise');
  const Relier = require('models/reliers/relier');
  const sinon = require('sinon');
  const TestHelpers = require('../../../lib/helpers');
  const User = require('models/user');
  const View = require('views/settings/display_name');

  const DISPLAY_NAME = 'joe';

  describe('views/settings/display_name', () => {
    let account;
    let email;
    let initialName;
    let metrics;
    let notifier;
    let relier;
    let sandbox;
    let user;
    let view;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();

      email = TestHelpers.createEmail();
      user = new User();
      relier = new Relier();
      notifier = new Notifier();
      metrics = new Metrics({ notifier });
      account = user.initAccount({
        email: email,
        sessionToken: 'fake session token',
        uid: 'uid',
        verified: true
      });
      initialName = DISPLAY_NAME;

      sandbox.stub(View.prototype, 'getSignedInAccount', () => account);
      sandbox.stub(View.prototype, 'checkAuthorization', () => p(true));
    });

    afterEach(() => {
      metrics.destroy();

      view.remove();
      view.destroy();
      sandbox.restore();

      view = metrics = null;
    });

    function initView () {
      sandbox.stub(account, 'fetchProfile', () => {
        // synthesize the displayName being set on profile fetch
        account.set('displayName', initialName);
        return p();
      });
      sandbox.stub(user, 'setAccount', () => p());

      view = new View({
        metrics: metrics,
        notifier: notifier,
        relier: relier,
        user: user
      });

      return view.render();
    }

    describe('rendering', () => {
      it('renders as expected', () => {
        return initView()
          .then(() => {
            assert.isTrue(account.fetchProfile.calledOnce);
            assert.isTrue(user.setAccount.calledWith(account));
            assert.equal(view.getElementValue('input.display-name'), DISPLAY_NAME);
          });
      });

      it('onProfileUpdate', () => {
        return initView()
          .then(() => {
            sandbox.stub(view, 'render', () => p());
            view.onProfileUpdate();
            assert.isTrue(view.render.calledOnce);
          });
      });

      it('has floating labels on input', () => {
        return initView()
          .then(() => {
            view.$('.display-name').val('a');
            var event = new $.Event('input');
            event.which = KeyCodes.ENTER;

            assert.isFalse(view.$('.label-helper').text().length > 0);
            view.$('.display-name').trigger(event);
            assert.isTrue(view.$('.label-helper').text().length > 0);
          });
      });
    });

    describe('with session', () => {
      it('has no display name set', () => {
        initialName = null;
        return initView()
          .then(() => {
            assert.equal(view.$('.add-button').length, 1);
            assert.equal(view.$('.settings-unit-toggle.primary').length, 1);
          });
      });

      it('has a display name set', () => {
        return initView()
          .then(() => {
            assert.equal(view.$('.change-button').length, 1);
            assert.equal(view.$('.settings-unit-toggle.secondary').length, 1);
          });
      });
    });

    describe('isValidStart', () => {
      it('validates the display name field for changes', () => {
        return initView()
          .then(() => {
            view.$('.display-name').val(DISPLAY_NAME);
            assert.equal(view.isValidStart(), false, 'name did not change');

            view.$('.display-name').val('joe change');
            assert.equal(view.isValidStart(), true, 'name changed');
          });
      });

      it('validates the display name field when it is not set', () => {
        initialName = null;
        return initView()
          .then(() => {
            view.$('.display-name').val('');
            assert.equal(view.isValidStart(), false, 'name did not change');

            view.$('.display-name').val('changed');
            assert.equal(view.isValidStart(), true, 'name changed');
          });
      });
    });

    describe('submit', () => {
      it('submits correctly', () => {
        const name = `  ${DISPLAY_NAME}  `;

        return initView()
          .then(() => {
            sandbox.spy(view, 'logViewEvent');
            sandbox.spy(view, 'navigate');
            sandbox.spy(view, 'render');
            sandbox.spy(view, 'updateDisplayName');
            sandbox.stub(view, 'displaySuccess', () => p());
            sandbox.stub(account, 'postDisplayName', () => p());

            view.$('input.display-name').val(name);
            return view.submit();
          }).then(() => {
            var expectedName = DISPLAY_NAME.trim();
            assert.isTrue(view.updateDisplayName.calledOnce);
            assert.isTrue(view.updateDisplayName.calledWith(account, expectedName));

            assert.isTrue(view.displaySuccess.calledOnce);

            assert.isTrue(view.logViewEvent.calledOnce);
            assert.isTrue(view.logViewEvent.calledWith('success'));

            assert.isTrue(view.navigate.calledOnce);
            assert.isTrue(view.navigate.calledWith('settings'));

            assert.isTrue(view.render.calledOnce);
          });
      });
    });
  });
});

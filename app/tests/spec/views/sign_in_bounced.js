/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const { assert } = require('chai');
  const { Model } = require('backbone');
  const sinon = require('sinon');
  const View = require('views/sign_in_bounced');
  const template = require('stache!templates/sign_in_bounced');

  describe('views/sign_in_bounced', () => {
    let clickHandler, formPrefill, model, user, view;

    beforeEach(() => {
      formPrefill = {
        clear: sinon.spy()
      };
      model = new Model();
      model.set('email', 'foo@example.com');
      user = {
        removeAllAccounts: sinon.spy()
      };
      view = new View({ formPrefill, model, user });
      clickHandler = view.events['click #create-account'];
    });

    it('set properties correctly', () => {
      assert.isFunction(clickHandler);
      assert.equal(view.template, template);
    });

    describe('click handler', () => {
      let event;

      beforeEach(() => {
        event = {
          preventDefault: sinon.spy()
        };
        view.navigate = sinon.spy();
        clickHandler.call(view, event);
      });

      it('called event.preventDefault correctly', () => {
        assert.equal(event.preventDefault.callCount, 1);
        assert.lengthOf(event.preventDefault.args[0], 0);
      });

      it('called user.removeAllAccounts correctly', () => {
        assert.equal(user.removeAllAccounts.callCount, 1);
        assert.lengthOf(user.removeAllAccounts.args[0], 0);
      });

      it('called formPrefill.clear correctly', () => {
        assert.equal(formPrefill.clear.callCount, 1);
        assert.lengthOf(formPrefill.clear.args[0], 0);
      });

      it('called view.navigate correctly', () => {
        assert.equal(view.navigate.callCount, 1);
        assert.lengthOf(view.navigate.args[0], 1);
        assert.equal(view.navigate.args[0][0], 'signup');
      });
    });
  });
});


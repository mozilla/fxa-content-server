/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const SmsMixin = require('views/mixins/sms-mixin');
  const { assert } = require('chai');
  const BaseView = require('views/base');
  const Cocktail = require('cocktail');
  const SearchParamMixin = require('lib/search-param-mixin');
  const sinon = require('sinon');
  const Template = require('stache!templates/test_template');

  const SmsView = BaseView.extend({
    template: Template
  });
  Cocktail.mixin(
    SmsView,
    SearchParamMixin,
    SmsMixin
  );

  describe('views/mixins/sms-mixin', function () {
    let view;

    beforeEach(() => {
      view = new SmsView({
        windowMock: window
      });
    });

    describe('`signinCodes=true` on the search params', () => {
      it('returns an array with `signinCodes`', () => {
        sinon.stub(view, 'getSearchParam', (searchParam) => {
          return searchParam === 'signinCodes' ? 'true' : undefined;
        });
        assert.isTrue(view.getSmsFeatures().indexOf('signinCodes') > -1);
      });
    });

    describe('no features', () => {
      it('returns an empty array', () => {
        assert.deepEqual(view.getSmsFeatures(), []);
      });
    });
  });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function(require, exports, module) {
  'use strict';

  var BaseView = require('views/base');
  var Chai = require('chai');
  var CheckboxMixin = require('views/mixins/checkbox-mixin');
  var Cocktail = require('cocktail');
  var sinon = require('sinon');
  var Template = require('stache!templates/test_template');

  var assert = Chai.assert;

  var View = BaseView.extend({
    template: Template
  });

  Cocktail.mixin(
    View,
    CheckboxMixin
  );

  describe('views/mixins/checkbox-mixin', function () {
    var view;

    beforeEach(function () {
      view = new View({
        screenName: 'checkbox-view'
      });

      return view.render()
        .then(function () {
          $('#container').html(view.el);
        });
    });

    it('logs when a checkbox is toggled on', function () {
      sinon.spy(view, 'logScreenEvent');

      view.$('#show-password').click();

      var eventName = view.logScreenEvent.args[0][0];
      assert.equal(eventName, 'checkbox.change.show-password.checked');
    });

    it('logs when a checkbox is toggled off', function () {
      sinon.spy(view, 'logScreenEvent');

      view.$('#show-password').attr('checked', 'checked').click();

      var eventName = view.logScreenEvent.args[0][0];
      assert.equal(eventName, 'checkbox.change.show-password.unchecked');
    });
  });
});


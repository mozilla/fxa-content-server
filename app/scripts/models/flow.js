/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A model to represent a login flow, holding the data that we
 * need to submit as part of our metrics when we perform actions
 * during the flow.
 *
 * Try to fetch the flowId and flowBegin from the resume token.
 * If unavailable there, fetch from data attributes in the DOM.
 */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const AuthErrors = require('lib/auth-errors');
  const Backbone = require('backbone');
  const Cocktail = require('cocktail');
  const ErrorUtils = require('lib/error-utils');
  const ResumeTokenMixin = require('models/mixins/resume-token');
  const SearchParamMixin = require('models/mixins/search-param');
  const vat = require('lib/vat');

  var Model = Backbone.Model.extend({
    initialize (options) {
      options = options || {};

      this.sentryMetrics = options.sentryMetrics;
      this.window = options.window || window;

      // We should either get both fields from the resume token, or neither.
      // Getting one without the other is an error.
      this.populateFromStringifiedResumeToken(this.getSearchParam('resume'));
      if (this.has('flowId')) {
        if (! this.has('flowBegin')) {
          this.logError(AuthErrors.toMissingResumeTokenPropertyError('flowBegin'));
        }
      } else if (this.has('flowBegin')) {
        this.logError(AuthErrors.toMissingResumeTokenPropertyError('flowId'));
      } else {
        this.populateFromDataAttribute('flowId');
        this.populateFromDataAttribute('flowBegin');
      }
    },

    defaults: {
      flowBegin: null,
      flowId: null
    },

    populateFromDataAttribute (property) {
      const $body = $(this.window.document.body);
      const attribute = `data-${hyphenate(property)}`;
      let data = $body.attr(attribute);

      if (! data) {
        this.logError(AuthErrors.toMissingDataAttributeError(property));
      } else {
        try {
          data = this.resumeTokenSchema[property].validate(data);
          this.set(property, data);
        } catch (err) {
          this.logError(AuthErrors.toInvalidDataAttributeError(property));
        }

        // If a user signs out then signs in again, it is a separate flow.
        // Remove the attributes from the DOM to ensure they're not re-used
        // if that happens.
        $body.removeAttr(attribute);
      }
    },

    logError (error) {
      return ErrorUtils.captureError(error, this.sentryMetrics);
    },

    resumeTokenFields: ['flowId', 'flowBegin'],

    resumeTokenSchema: {
      flowBegin: vat.number().test(function (value) {
        // Integers only
        return value === Math.round(value);
      }),
      flowId: vat.hex().len(64)
    }
  });

  Cocktail.mixin(
    Model,
    ResumeTokenMixin,
    SearchParamMixin
  );

  module.exports = Model;

  function hyphenate (string) {
    return string.replace(/[A-Z]/g, uppercase => `-${uppercase.toLowerCase()}`);
  }
});

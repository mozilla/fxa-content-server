/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Upgrade jQuery elements with two functions:
 * 1. `val` - overridden in some cases to do cleanup
 * 2. `validate` - validate the element value. If valid, returns falsy value,
 *    if invalid, returns an Error
 */
define(function (require, exports, module) {
  'use strict';

  const _ = require('underscore');
  const checkboxInput = require('views/elements/checkbox-input');
  const defaultElement = require('views/elements/default');
  const emailInput = require('views/elements/email-input');
  const passwordInput = require('views/elements/password-input');
  const textInput = require('views/elements/text-input');

  const elementOverrides = [
    checkboxInput,
    emailInput,
    passwordInput,
    textInput,
    defaultElement // defaultElemehnt is last since it is the fallback.
  ];

  return function ($el) {
    const elementOverride =
      _.find(elementOverrides, (elementOverride) => elementOverride.match($el));

    if (elementOverride.val && ! $el.__val) {
      $el.__val = $el.val;
      $el.val = elementOverride.val.bind($el);
    }

    if (! $el.validate) {
      $el.validate = elementOverride.validate.bind($el);
    }

    return $el;
  };
});

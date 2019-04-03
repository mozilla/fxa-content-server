/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Display a password strength balloon. Component automatically
 * updates whenever changes are made to the underlying model.
 *
 * @export
 * @class PasswordRepeatBalloonView
 * @extends {BaseView}
 */

import BaseView from '../base';
import Cocktail from 'cocktail';
import OneVisibleOfTypeMixin from '../mixins/one-visible-of-type-mixin';
import Template from '../../templates/partial/password-repeat-balloon.mustache';

// Allow the balloon to stay visible for a bit so that
// the user can see all the criteria were met.
const DELAY_BEFORE_HIDE_MS = 750;

const DELAY_BEFORE_HIDE_BALLOON_EL_MS = 500;

const PASSWORD_REPEAT_BALLOON_SELECTOR = '.password-repeat-balloon';

class PasswordRepeatBalloonView extends BaseView {
  template = Template;

  initialize (config = {}) {
    this.delayBeforeHideMS = config.delayBeforeHideMS || DELAY_BEFORE_HIDE_MS;
  }

  afterRender () {
    this.show();
  }

  update () {
    this.clearTimeouts();
    return this.render()
      .then(() => this.hideAfterDelay());
  }

  clearTimeouts () {
    this.clearTimeout(this._hideTimeout);
    this.clearTimeout(this._hideBalloonElTimeout);
  }

  show () {
    this.$(PASSWORD_REPEAT_BALLOON_SELECTOR).show().css('opacity', '1');
  }

  hide () {
    const $balloonEl = this.$(PASSWORD_REPEAT_BALLOON_SELECTOR);
    $balloonEl.css('opacity', '0');
    this._hideBalloonElTimeout = this.setTimeout(() => {
      $balloonEl.hide();
    }, DELAY_BEFORE_HIDE_BALLOON_EL_MS);
  }

  hideAfterDelay () {
    this._hideTimeout = this.setTimeout(() => {
      this.hide();
    }, this.delayBeforeHideMS);
  }
}

Cocktail.mixin(
  PasswordRepeatBalloonView,
  OneVisibleOfTypeMixin({
    hideMethod: 'hide',
    showMethod: 'show',
    viewType: 'tooltip'
  })
);

export default PasswordRepeatBalloonView;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creates and manages a PasswordRepeatBalloon.
 * Updates to the bound password element cause updates to the model
 * which are propagated out to the PasswordRepeatBalloon to
 * update the UI.
 *
 * @export
 * @class PasswordWithRepeatBalloonView
 * @extends {FormView}
 */

import FormView from '../form';
import PasswordRepeatBalloonView from './password_repeat_balloon';

const PasswordWithRepeatBalloonView = FormView.extend({
  events: {
    blur: 'hideBalloon',
    focus: 'showBalloon',
  },

  initialize (options = {}) {
    this.passwordHelperBalloon = options.passwordHelperBalloon;
    this.balloonEl = options.balloonEl;
  },

  showBalloon () {
    if (! this.passwordHelperBalloon) {
      this.passwordHelperBalloon = new PasswordRepeatBalloonView({
        el: this.balloonEl,
        lang: this.lang,
        model: this.model,
        translator: this.translator
      });
      this.trackChildView(this.passwordHelperBalloon);
    }
    return this.passwordHelperBalloon.render()
      .then(() => this.passwordHelperBalloon.show());
  },

  hideBalloon () {
    if (this.passwordHelperBalloon) {
      return this.passwordHelperBalloon.hide();
    }
  }
});

export default PasswordWithRepeatBalloonView;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import PasswordWithRepeatBalloonView from '../password_repeat/password_with_repeat_balloon';

/**
 * Create the mixin to set up the password repeat UI.
 *
 * @param {Object} config
 *   @param {String} config.balloonEl selector where the password repeat balloon should attach
 *   @param {String} config.passwordEl selector for the password element to watch
 * @returns {Object} the mixin
 */
export default function (config = {}) {
  const { balloonEl, passwordEl } = config;

  return {
    afterRender () {
      return Promise.resolve().then(() => {
        if (! this.$(passwordEl).length) {
          return;
        }
        const passwordView = this._createPasswordWithRepeatBalloonView();
        this.trackChildView(passwordView);
      });
    },

    _createPasswordWithRepeatBalloonView () {
      return new PasswordWithRepeatBalloonView({
        balloonEl: this.$(balloonEl),
        el: this.$(passwordEl),
        lang: this.lang,
        translator: this.translator
      });
    }
  };
}

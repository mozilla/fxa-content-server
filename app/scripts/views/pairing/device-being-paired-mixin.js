/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assign } from 'underscore';
import DeviceBeingPairedTemplate from '../../templates/partial/device-being-paired.mustache';

/**
 * Create a mixin that sets `unsafeDeviceBeingPairedHTML` on the mixed in view's context.
 * The HTML will be the info of the device being paired with.
 *
 * @export
 * @param {Object} [options={}]
 *   @param {Boolean} [options.showConfirmationCode = true] if `false`, confirmation code is not sent.
 * @returns {Object}
 */
export default function (options = {}) {
  return {
    setInitialContext(context) {
      const deviceContext = assign({}, this.broker.get('remoteMetaData'));

      if (options.showConfirmationCode !== false) {
        const confirmationCode = this.broker.get('confirmationCode') || '';
        deviceContext.confirmationCode = `${confirmationCode.substr(0, 4)}-${confirmationCode.substr(4)}`;
      }

      context.set({
        unsafeDeviceBeingPairedHTML: this.renderTemplate(DeviceBeingPairedTemplate, deviceContext)
      });
    }
  };
}

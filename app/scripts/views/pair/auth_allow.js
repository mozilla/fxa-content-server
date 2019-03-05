/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assign } from 'underscore';
import AuthErrors from '../../lib/auth-errors';
import Cocktail from 'cocktail';
import DeviceBeingPairedMixin from './device-being-paired-mixin';
import FormView from '../form';
import { preventDefaultThen } from '../base';
import Template from '../../templates/pair/auth_allow.mustache';

class PairAuthAllowView extends FormView {
  template = Template;

  events = assign(this.events, {
    'click #cancel': preventDefaultThen('cancel')
  });

  beforeRender () {
    const account = this.getSignedInAccount();

    this.listenTo(this.broker, 'error', this.displayError);

    if (! account) {
      this.replaceCurrentPage('pair/failure', {
        error: AuthErrors.toError('UNKNOWN_ACCOUNT'),
      });
    }

    return account.checkTotpTokenExists().then((result) => {
      // pairing is disabled for accounts with 2FA
      if (result.exists) {
        this.replaceCurrentPage('pair/failure', {
          error: AuthErrors.toError('TOTP_PAIRING_NOT_SUPPORTED'),
        });
      }
    });
  }

  submit () {
    return this.invokeBrokerMethod('afterPairAuthAllow');
  }

  cancel () {
    this.replaceCurrentPage('pair/failure');
    return this.invokeBrokerMethod('afterPairAuthDecline');
  }
}

Cocktail.mixin(
  PairAuthAllowView,
  DeviceBeingPairedMixin(),
);

export default PairAuthAllowView;

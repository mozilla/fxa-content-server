/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthErrors from '../../lib/auth-errors';
import Cocktail from 'cocktail';
import DeviceBeingPairedMixin from './device-being-paired-mixin';
import FormView from '../form';
import PasswordMixin from '../mixins/password-mixin';
import Template from '../../templates/pair_auth_allow.mustache';
class PairAuthAllowView extends FormView {
  template = Template;

  beforeRender() {
    if (! this.getAccount()) {
      this.navigate('signin');
    } else if (! this.model.get('keys_jwk')) {
      this.navigate('pair/auth');
    }

    // TODO - make the error message say something like
    // "Remote user tried to send invalid data"
    this._updateRelier();
  }

  getAccount () {
    return this.getSignedInAccount();
  }

  _updateRelier () {
    // any validation errors in the data sent from the Supp
    // will be caught when creating the relier and a message
    // will be displayed to the user.
    this.relier.initializeWithPKCEParams(
      this.model.pick(
        'access_type',
        'client_id',
        'code_challenge',
        'code_challenge_method',
        'keys_jwk',
        'response_type',
        'redirect_uri',
        'scope',
        'state'
      )
    );
    this.relier.set('senderMetaData', this.model.get('senderMetaData'));
  }

  submit () {
    return this.invokeBrokerMethod(
      'afterPairAuthAllow',
      this.getAccount(),
      this.getElementValue('input[type=password]')
    ).catch(err => {
      if (AuthErrors.is(err, 'INCORRECT_PASSWORD')) {
        this.showValidationError('input[type=password]', err);
        return;
      }

      throw err;
    });

  }
}

Cocktail.mixin(
  PairAuthAllowView,
  DeviceBeingPairedMixin(),
  PasswordMixin,
);

export default PairAuthAllowView;

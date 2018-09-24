/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assign } from 'underscore';
import Cocktail from 'cocktail';
import DeviceBeingPairedMixin from './device-being-paired-mixin';
import FormView from '../form';
import PasswordMixin from '../mixins/password-mixin';
import { preventDefaultThen } from '../base';
import ServiceMixin from '../mixins/service-mixin';
import Template from '../../templates/pair_auth_allow.mustache';
class PairAuthAllowView extends FormView {
  template = Template;

  events = assign(this.events, {
    'click #cancel': preventDefaultThen('cancel')
  });

  initialize () {
    this.listenTo(this.broker, 'error', this.displayError);
  }

  beforeRender() {
    /*
    if (! this.getAccount()) {
      this.navigate('signin');
    } else if (! this.relier.get('keysJwk')) {
      this.navigate('pair/auth');
    }*/
  }

  getAccount () {
    return this.getSignedInAccount();
  }

  setInitialContext (context) {
    context.set({
      email: this.getAccount().get('email')
    });
  }

  submit () {
    return this.invokeBrokerMethod('afterPairAuthAllow', this.getAccount());
  }

  cancel () {
    alert('cancel flow');
  }
}

Cocktail.mixin(
  PairAuthAllowView,
  DeviceBeingPairedMixin({ showConfirmationCode: true }),
  PasswordMixin,
  ServiceMixin,
);

export default PairAuthAllowView;

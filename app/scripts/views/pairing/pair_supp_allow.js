/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assign } from 'underscore';
import Cocktail from 'cocktail';
import FormView from '../form';
import DeviceBeingPairedMixin from './device-being-paired-mixin';
import { preventDefaultThen } from '../base';
import ServiceMixin from '../mixins/service-mixin';
import Template from '../../templates/pair_supp_allow.mustache';

class PairSuppAllowView extends FormView {
  template = Template;

  events = assign(this.events, {
    'click #cancel': preventDefaultThen('cancel')
  });

  beforeRender() {
    if (! this.broker.get('remoteMetaData')) {
      this.navigate('pair/supp');
    }
  }

  setInitialContext (context) {
    context.set(this.model.pick(
      'deviceName',
      'displayName',
      'email',
      'profileImageUrl'
    ));
  }

  submit () {
    return this.invokeBrokerMethod('afterSupplicantApprove');
  }

  cancel () {
    this.navigate('/pair/failure');
  }
}

Cocktail.mixin(
  PairSuppAllowView,
  DeviceBeingPairedMixin(),
  ServiceMixin,
);

export default PairSuppAllowView;

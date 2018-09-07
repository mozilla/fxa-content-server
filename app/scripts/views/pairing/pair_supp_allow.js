/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Cocktail from 'cocktail';
import FormView from '../form';
import DeviceBeingPairedMixin from './device-being-paired-mixin';
import Template from '../../templates/pair_supp_allow.mustache';

class PairSuppAllowView extends FormView {
  template = Template;

  beforeRender() {
    if (! this.model.get('senderMetaData')) {
      this.navigate('pair/supp');
    }

    this.relier.set('senderMetaData', this.model.get('senderMetaData'));
  }

  submit () {
    return this.invokeBrokerMethod('afterPairSupplicantAllow');
  }
}

Cocktail.mixin(
  PairSuppAllowView,
  DeviceBeingPairedMixin(),
);

export default PairSuppAllowView;

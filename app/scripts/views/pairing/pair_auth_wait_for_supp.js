/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import BaseView from '../base';
import Cocktail from 'cocktail';
import DeviceBeingPairedMixin from './device-being-paired-mixin';
import Template from '../../templates/pair_auth_wait_for_supp.mustache';

class PairAuthWaitForSuppView extends BaseView {
  template = Template;

  beforeRender() {
    if (! this.model.get('channelServerClient')) {
      this.navigate('pair/auth');
    }
  }
}

Cocktail.mixin(
  PairAuthWaitForSuppView,
  DeviceBeingPairedMixin(),
);

export default PairAuthWaitForSuppView;

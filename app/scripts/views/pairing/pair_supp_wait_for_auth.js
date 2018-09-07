/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import BaseView from '../base';
import Cocktail from 'cocktail';
import DeviceBeingPairedMixin from './device-being-paired-mixin';
import Template from '../../templates/pair_supp_wait_for_auth.mustache';

class PairSuppWaitForAuthView extends BaseView {
  template = Template;

  events = {
    'click #retry': 'tradeCodeForKeys'
  };

  initialize (options) {
    super.initialize(options);

    this.listenTo(this.model, 'change', this.render);
  }

  beforeRender() {
    if (! this.relier.get('senderMetaData')) {
      this.navigate('pair/supp');
    }
  }

  afterVisible () {
    this.listenTo(this.broker.channelServerClient, 'pair:auth:approve', this.validateAndCompleteApproval);
  }

  validateAndCompleteApproval (approvalData) {
    return Promise.resolve().then(() => {
      this.relier.validateApprovalData(approvalData);

      const { code } = approvalData;
      this.model.set('code', code);

      return this.invokeBrokerMethod('afterCodeReceived', code);
    }).catch(err => this.displayError(err));
  }
}

Cocktail.mixin(
  PairSuppWaitForAuthView,
  DeviceBeingPairedMixin()
);

export default PairSuppWaitForAuthView;

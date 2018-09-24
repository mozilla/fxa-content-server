/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { CompleteState, State } from './state';
import PairingFlowStateMachine from './state-machine';
/* eslint-disable no-use-before-define */

class WaitForAuthorityAuthorize extends State {
  name = 'WaitForAuthApprove';

  constructor (...args) {
    super(...args);

    this.navigate('pair/auth/allow');

    this.listenTo(this.notifier, 'pair:auth:authorize', this.gotoComplete);
  }

  gotoComplete ({ result }) {
    this.broker.sendOAuthResultToRelier(result);

    this.gotoState(PairAuthComplete);
  }
}

class PairAuthComplete extends CompleteState {
  constructor (...args) {
    super(...args);

    this.navigate('pair/auth/complete');
  }
}

class AuthorityStateMachine extends PairingFlowStateMachine {
  constructor(attrs, options = {}) {
    super(attrs, options);

    this.createState(WaitForAuthorityAuthorize);
  }
}

export default AuthorityStateMachine;
/* eslint-enable no-use-before-define */

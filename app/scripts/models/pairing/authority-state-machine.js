/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { CompleteState, State } from './state';
import PairingFlowStateMachine from './state-machine';
/* eslint-disable no-use-before-define */

class WaitForAuthorizations extends State {
  name = 'WaitForAuthorizations';

  constructor (...args) {
    super(...args);

    this.navigate('pair/auth/allow');

    this.listenTo(this.notifier, 'pair:supp:authorize', this.onSupplicantAuthorize);
    this.listenTo(this.notifier, 'pair:auth:authorize', this.onAuthorityAuthorize);
  }

  onSupplicantAuthorize () {
    this.gotoState(WaitForAuthorityAuthorize);
  }

  onAuthorityAuthorize (result) {
    this.gotoState(WaitForSupplicantAuthorize, result);
  }
}

class WaitForSupplicantAuthorize extends State {
  name = 'WaitForSupplicantAuthorize';

  constructor (...args) {
    super(...args);

    this.navigate('/pair/auth/wait_for_supp');
    this.listenTo(this.notifier, 'pair:supp:authorize', this.gotoComplete);
  }

  gotoComplete () {
    this.gotoState(PairAuthComplete, {});
  }
}

class WaitForAuthorityAuthorize extends State {
  name = 'WaitForAuthApprove';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:auth:authorize', this.gotoComplete);
  }

  gotoComplete (result) {
    this.gotoState(PairAuthComplete, result);
  }
}

class PairAuthComplete extends CompleteState {
  constructor (...args) {
    super(...args);

    this.navigate('pair/auth/complete');
  }
}

class PairAuthFailure extends CompleteState {
  constructor (...args) {
    super(...args);

    this.navigate('pair/failure');
  }
}

class AuthorityStateMachine extends PairingFlowStateMachine {
  constructor(attrs, options = {}) {
    super(attrs, options);

    this.createState(WaitForAuthorizations);
  }

  heartbeatError (error) {
    this.createState(PairAuthFailure, { error });
  }
}

export default AuthorityStateMachine;
/* eslint-enable no-use-before-define */

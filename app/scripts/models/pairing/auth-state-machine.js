/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthErrors from '../../lib/auth-errors';
import { CompleteState, State } from './state';
import StateMachine from './state-machine';
/* eslint-disable no-use-before-define */

class AuthState extends State {
  connectionClosed () {
    this.navigate('pair/auth', {
      error: AuthErrors.toError('PAIRING_CHANNEL_CONNECTION_CLOSED')
    });
  }

  connectionError () {
    this.navigate('pair/auth', {
      error: AuthErrors.toError('PAIRING_CHANNEL_CONNECTION_ERROR')
    });
  }
}

class WaitForConnectionToChannelServer extends AuthState {
  name = 'WaitForConnectionToChannelServer';

  constructor (...args) {
    super(...args);

    this.listenTo(this.channelServerClient, 'connected', this.gotoWaitForSuppRequest);
  }

  connectionClosed () {
    // do nothing on connection closed
  }

  gotoWaitForSuppRequest () {
    this.gotoState(WaitForSuppRequest);
  }
}

class WaitForSuppRequest extends AuthState {
  name = 'WaitForSuppRequest';

  constructor (...args) {
    super(...args);
    this.navigate('pair/auth/wait_for_supp');

    this.listenTo(this.channelServerClient, 'pair:supp:request', this.gotoWaitForAuthApprove);
  }

  gotoWaitForAuthApprove (data) {
    this.navigate('pair/auth/allow', data);

    // TODO - send the user & service metadata here too.
    this.channelServerClient.send('pair:auth:metadata', {});

    this.gotoState(WaitForAuthApprove);
  }
}

class WaitForAuthApprove extends AuthState {
  name = 'WaitForAuthApprove';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:auth:approve', this.gotoComplete);
  }

  gotoComplete ({ model, result }) {
    this.channelServerClient.send('pair:auth:approve', result);

    this.navigate('pair/auth/complete', model);

    this.gotoState(CompleteState);
  }
}

class AuthStateMachine extends StateMachine {
  constructor(attrs, options = {}) {
    super(attrs, options);

    this.createState(WaitForConnectionToChannelServer);
  }
}

export default AuthStateMachine;
/* eslint-enable no-use-before-define */

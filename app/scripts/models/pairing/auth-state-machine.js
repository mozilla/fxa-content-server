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

    this.listenTo(this.channelServerClient, 'connected', this.gotoWaitForSuppConnection);
  }

  connectionClosed () {
    // do nothing on connection closed
  }

  gotoWaitForSuppConnection () {
    this.gotoState(WaitForSuppConnection);
  }
}

class WaitForSuppConnection extends AuthState {
  name = 'WaitForSuppConnection';

  constructor (...args) {
    super(...args);

    this.listenTo(this.channelServerClient, 'pair:supp:connected', this.gotoWaitForSuppRequest);
  }

  connectionClosed () {
    // do nothing on connection closed
  }

  gotoWaitForSuppRequest (data) {
    // let the supp know that we are connected. w/o the message
    // the supp will not advance.
    this.channelServerClient.send('pair:auth:connected');

    this.navigate('pair/auth/wait_for_supp', data);

    this.gotoState(WaitForSuppRequest);
  }
}

class WaitForSuppRequest extends AuthState {
  name = 'WaitForSuppRequest';

  constructor (...args) {
    super(...args);

    this.listenTo(this.channelServerClient, 'pair:supp:request', this.gotoWaitForAuthApprove);
  }

  gotoWaitForAuthApprove (data) {
    this.navigate('pair/auth/allow', data);

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

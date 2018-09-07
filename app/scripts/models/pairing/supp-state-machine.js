/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthErrors from '../../lib/auth-errors';
import { assign } from 'underscore';
import { CompleteState, State } from './state';
import StateMachine from './state-machine';

/* eslint-disable no-use-before-define */

class SupplicantState extends State {
  connectionClosed () {
    this.navigate('pair/supp', {
      error: AuthErrors.toError('PAIRING_CHANNEL_CONNECTION_CLOSED')
    });
  }

  connectionError () {
    this.navigate('pair/supp', {
      error: AuthErrors.toError('PAIRING_CHANNEL_CONNECTION_ERROR')
    });
  }
}

class WaitForConnectionToChannelServer extends SupplicantState {
  name = 'WaitForConnectionToChannelServer';

  constructor (...args) {
    super(...args);

    this.listenTo(this.channelServerClient, 'connected', this.gotoWaitForAuthentication);
  }

  connectionClosed () {
    // do nothing on connection closed
  }

  gotoWaitForAuthentication () {
    this.channelServerClient.send('pair:supp:connected');

    this.gotoState(WaitForAuthConnection);
  }
}

class WaitForAuthConnection extends SupplicantState {
  name = 'WaitForAuthConnection';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:auth:connected', this.gotoWaitForSuppRequest);
  }

  gotoWaitForSuppRequest (data) {
    this.navigate('pair/supp/allow', data);

    this.gotoState(WaitForSuppRequest);
  }
}

class WaitForSuppRequest extends SupplicantState {
  name = 'WaitForSuppRequest';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:supp:request', this.gotoWaitForAuthResponse);
  }

  gotoWaitForAuthResponse (params) {
    this.channelServerClient.send('pair:supp:request', params);

    this.navigate('pair/supp/wait_for_auth', assign({
      flowParams: params
    }));

    this.gotoState(WaitForAuthResponse);
  }
}

class WaitForAuthResponse extends SupplicantState {
  name = 'WaitForAuthResponse';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:auth:approve', this.gotoWaitForSuppComplete);
  }

  gotoWaitForSuppComplete (data) {
    // no screen transition here
    this.gotoState(WaitForSuppComplete);
  }
}

class WaitForSuppComplete extends SupplicantState {
  name = 'WaitForSuppComplete';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:supp:complete', this.gotoComplete);
  }

  gotoComplete ({ model, result }) {
    console.log('decrypted result', result);

    this.navigate('pair/supp/complete', model);

    this.gotoState(CompleteState);
  }
}


class SupplicantStateMachine extends StateMachine {
  constructor(attrs, options = {}) {
    super(attrs, options);

    this.createState(WaitForConnectionToChannelServer);
  }
}

export default SupplicantStateMachine;

/* eslint-enable no-use-before-define */

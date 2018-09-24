/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ChannelServerClientErrors from '../../lib/channel-server-client-errors';
import { CompleteState, State } from './state';
import PairingFlowStateMachine from './state-machine';

/* eslint-disable no-use-before-define */

class SupplicantState extends State {
  constructor (attributes, options = {}) {
    super(attributes, options);

    this.channelServerClient = options.channelServerClient;
    this.listenTo(this.channelServerClient, 'close', () => this.socketClosed());
    this.listenTo(this.channelServerClient, 'error', (error) => this.socketError(error));
  }

  socketClosed () {
    this.navigate('pair/failure', {
      error: ChannelServerClientErrors.toError('CONNECTION_CLOSED')
    });
  }

  socketError (error) {
    this.navigate('pair/failure', { error });
  }
}

class WaitForConnectionToChannelServer extends SupplicantState {
  name = 'WaitForConnectionToChannelServer';

  constructor (...args) {
    super(...args);

    this.listenTo(this.channelServerClient, 'connected', this.gotoSendOAuthRequestWaitForAccountMetadata);
  }

  socketClosed () {
    // do nothing on connection closed
  }

  gotoSendOAuthRequestWaitForAccountMetadata () {
    this.gotoState(SendOAuthRequestWaitForAccountMetadata);
  }
}

class SendOAuthRequestWaitForAccountMetadata extends SupplicantState {
  name = 'WaitForAccountMetadata';

  constructor (...args) {
    super(...args);

    this.channelServerClient.send('pair:supp:request', this.relier.getOAuthParams()).then(() => {
      this.listenTo(this.channelServerClient, 'remote:pair:auth:metadata', this.gotoWaitForApprovals);
    });
  }

  gotoWaitForApprovals (data) {
    this.broker.setRemoteMetaData(data.remoteMetaData);

    this.gotoState(WaitForAuthorizations, data);
  }
}

function onAuthAuthorize (NextState, result) {
  return Promise.resolve().then(() => {
    this.relier.validateApprovalData(result);
    const { code } = result;
    this.relier.set({ code });

    this.gotoState(NextState);
  }).catch(err => this.trigger('error', err));
}

class WaitForAuthorizations extends SupplicantState {
  name = 'WaitForApprovals';

  constructor (...args) {
    super(...args);

    this.navigate('pair/supp/allow', {
      deviceName: this.get('deviceName'),
    });

    this.listenTo(this.channelServerClient, 'remote:pair:auth:authorize', this.onAuthorityAuthorize);
    this.listenTo(this.notifier, 'pair:supp:authorize', this.onSupplicantAuthorize);
  }

  onAuthorityAuthorize = onAuthAuthorize.bind(this, WaitForSupplicantAuthorize);

  onSupplicantAuthorize () {
    this.channelServerClient.send('pair:supp:authorize').then(() => {
      this.gotoState(WaitForAuthorityAuthorize);
    });
  }
}

class WaitForSupplicantAuthorize extends SupplicantState {
  name = 'WaitForSupplicantAuthorize';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:supp:authorize', this.onSupplicantAuthorize);
  }

  onSupplicantAuthorize () {
    this.channelServerClient.send('pair:supp:authorize').then(() => {
      return this.gotoState(SendResultToRelier);
    });

  }
}

class WaitForAuthorityAuthorize extends SupplicantState {
  name = 'WaitForAuthorityAuthorize';

  constructor (...args) {
    super(...args);
    this.navigate('pair/supp/wait_for_auth');

    this.listenTo(this.channelServerClient, 'remote:pair:auth:authorize', this.onAuthorityAuthorize);
  }

  onAuthorityAuthorize = onAuthAuthorize.bind(this, SendResultToRelier);
}

class SendResultToRelier extends SupplicantState {
  name = 'SendResultToRelier';

  socketClosed () {
    // do nothing, this is expected to happen
  }

  constructor (...args) {
    super(...args);
    // causes the channel to be closed by the remote end.
    // The connectionClosed handler of CompleteState will
    // do nothing.
    this.broker.sendCodeToRelier()
      .then(() => {
        this.gotoState(CompleteState);
      })
      .catch(err => this.trigger('error', err));
  }
}

class SupplicantStateMachine extends PairingFlowStateMachine {
  constructor(attrs, options = {}) {
    super(attrs, options);

    this.createState(WaitForConnectionToChannelServer);
  }
}

export default SupplicantStateMachine;

/* eslint-enable no-use-before-define */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthErrors from '../../lib/auth-errors';
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

    this.listenTo(this.channelServerClient, 'connected', this.gotoSendOAuthRequestWaitForAccountMetadata);
  }

  connectionClosed () {
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

    this.channelServerClient.send('pair:supp:request', this.relier.getPKCEParams());

    this.listenTo(this.notifier, 'pair:auth:metadata', this.gotoWaitForApprovals);
  }

  gotoWaitForApprovals (data) {
    console.log('sender meta data', data);
    this.gotoState(WaitForApprovals, data);
  }
}

class WaitForApprovals extends SupplicantState {
  name = 'WaitForApprovals';

  constructor (...args) {
    super(...args);

    this.navigate('pair/supp/allow', this.pick('senderMetaData'));

    this.listenTo(this.notifier, 'pair:auth:approve', this.onAuthApprove);
    this.listenTo(this.notifier, 'pair:supp:approve', this.onSuppApprove);
  }

  onAuthApprove (approvalData) {
    return Promise.resolve().then(() => {
      this.relier.validateApprovalData(approvalData);
      const { code } = approvalData;

      this.relier.set({ code });
      this.set('authApproves', true);

      this.gotoState(WaitForSuppApprove);
    }).catch(err => this.trigger('error', err));
  }

  onSuppApprove (data) {
    this.gotoState(WaitForAuthApprove);
  }
}

class WaitForSuppApprove extends SupplicantState {
  name = 'WaitForSuppApprove';

  constructor (...args) {
    super(...args);

    this.listenTo(this.notifier, 'pair:supp:approve', this.gotoSendResultToRelier);
  }


  gotoSendResultToRelier () {
    this.gotoState(SendResultToRelier);
  }
}

class WaitForAuthApprove extends SupplicantState {
  name = 'WaitForAuthApprove';

  constructor (...args) {
    super(...args);
    this.navigate('/pair/supp/wait_for_auth');

    this.listenTo(this.notifier, 'pair:auth:approve', this.gotoSendResultToRelier);
  }


  gotoSendResultToRelier (result) {
    return Promise.resolve().then(() => {
      this.relier.validateApprovalData(result);
      const { code } = result;

      this.relier.set({ code });
      this.set('authApproves', true);

      this.gotoState(SendResultToRelier);
    }).catch(err => this.trigger('error', err));
  }
}

class SendResultToRelier extends SupplicantState {
  name = 'SendResultToRelier';

  constructor (...args) {
    super(...args);

    // TODO - should the user be required to click a button
    // to go back to the relier?
    //this.navigate('/pair/supp/complete');

    this.broker.sendCodeToRelier()
      .then(() => {
        this.gotoState(CompleteState);
      })
      .catch(err => this.trigger('error', err));
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

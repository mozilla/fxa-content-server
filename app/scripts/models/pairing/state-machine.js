/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Model } from 'backbone';

class SuppStateMachine extends Model {
  constructor(attrs, options = {}) {
    super(attrs, options);

    this.channelServerClient = options.channelServerClient;
    this.notifier = options.notifier;
  }

  createState(StateConstructor, attrs = {}) {
    if (this.state) {
      console.log('destroyed state', this.state.name);

      this.state.destroy();
    }

    this.state = new StateConstructor(attrs, {
      channelServerClient: this.channelServerClient,
      notifier: this.notifier
    });

    this.listenTo(this.state, 'goto.state', this.createState);
    console.log('created state', this.state.name);
  }
}

export default SuppStateMachine;

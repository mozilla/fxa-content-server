/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import $ from 'jquery';
import { assign } from 'underscore';
import { Model } from 'backbone';

/* eslint-disable no-use-before-define */
export class State extends Model {
  constructor (attributes, options = {}) {
    super(attributes, options);

    this.channelServerClient = options.channelServerClient;
    this.listenTo(this.channelServerClient, 'close', () => this.connectionClosed());
    this.listenTo(this.channelServerClient, 'error', () => this.connectionError());

    this.notifier = options.notifier;

    this.onBeforeUnload = () => {
      this.gotoState(CompleteState);
    };
    $(window).on('beforeunload', this.onBeforeUnload);
  }

  connectionClosed () {
    throw new Error('connectionClosed must be overridden');
  }

  connectionError () {
    throw new Error('connectionError must be overridden');
  }

  destroy () {
    $(window).off('beforeunload', this.onBeforeUnload);
    this.stopListening();
    super.destroy();
  }

  gotoState (NextState) {
    this.trigger('goto.state', NextState);
  }

  navigate (url, nextViewData) {
    console.log(this.name, 'navigating to', url, nextViewData);
    try {

      this.notifier.trigger('navigate', {
        nextViewData: assign(this.toJSON(), nextViewData),
        routerOptions: {},
        url,
      });
    } catch (e) {
      console.log('uh oh', String(e));
    }
  }
}

export class CompleteState extends State {
  name = 'Complete';

  connectionClosed () {
    // do nothing on connection closed
  }

  next () {
    // there should be no next
  }
}

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

    this.broker = options.broker;
    this.notifier = options.notifier;
    this.parent = options.parent;
    this.oAuthClient = options.oAuthClient;
    this.relier = options.relier;

    this.onBeforeUnload = () => {
      this.gotoState(CompleteState);
    };
    $(window).on('beforeunload', this.onBeforeUnload);
  }

  destroy () {
    $(window).off('beforeunload', this.onBeforeUnload);
    this.stopListening();
    super.destroy();
  }

  gotoState (NextState, attrs) {
    this.trigger('goto.state', NextState, attrs);
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

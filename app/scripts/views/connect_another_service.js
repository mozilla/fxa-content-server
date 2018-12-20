/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Cocktail from 'cocktail';
import BaseView from './base';
import Template from 'templates/connect_another_service.mustache';

const View = BaseView.extend({
  className: 'connect-another-service',
  template: Template,

  setInitialContext (context) {
    const services = [
      {
        description: 'A Secure Notepad App.',
        image: 'notes',
        link: 'https://play.google.com/store/apps/details?id=org.mozilla.testpilot.notes&hl=en',
        name: 'Notes',
      },
      {
        description: 'Save articles, videos and stories from any publication, page or app.',
        image: 'pocket',
        link: 'https://getpocket.com/ff_signin?s=pocket&t=login',
        name: 'Pocket',
      },
      {
        description: 'Take your passwords everywhere with Firefox Lockbox.',
        image: 'lockbox',
        link: 'https://itunes.apple.com/us/app/firefox-lockbox/id1314000270?mt=8',
        name: 'Lockbox',
      },
      {
        description: 'Detects threats against your online accounts.',
        image: 'monitor',
        link: 'https://monitor.firefox.com/',
        name: 'Monitor',
      }
    ];

    context.set({
      'connect-services': services
    });
  },
});


Cocktail.mixin(
  View,
);

module.exports = View;

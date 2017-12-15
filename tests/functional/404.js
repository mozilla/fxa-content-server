/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { registerSuite } = intern.getInterface('object');

registerSuite('404', {
  'visit an invalid page': function () {
    //var url = intern.config.fxaContentRoot + 'four-oh-four';
    var url =  'https://latest.dev.lcip.org/four-oh-four';

    return this.remote
      .get(url)
      .setFindTimeout(5000)
      .findById('fxa-404-home')
      .click()
      .end()

      // success is going to the signup screen
      .findById('fxa-signup-header')
      .end();
  }
});

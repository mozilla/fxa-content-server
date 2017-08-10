/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const config = require('../configuration').getProperties();
const clientAddressDepth = config.clientAddressDepth || 1;

module.exports = (request) => {
  let xff = (request.headers['x-forwarded-for'] || '').split(/\s*,\s*/);
  xff.push(request.ip || request.connection.remoteAddress);
  // Remove empty items from the list, in case of badly-formed header.
  xff = xff.filter(x => x);
  let clientAddressIndex = xff.length - (clientAddressDepth);
  if (clientAddressIndex < 0) {
    clientAddressIndex = 0;
  }
  return {
    clientAddress: xff[clientAddressIndex],
    remoteAddressChain: xff
  };
};

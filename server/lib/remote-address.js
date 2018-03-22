/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Utility function to parse the client IP address from request headers.

'use strict';

const CLIENT_IP_ADDRESS_DEPTH = require('./configuration').get('clientAddressDepth') || 1;

// Crude IP address validation. Allows invalid IP addresses but is still
// useful for rejecting unsafe input.
const IPV4_ADDRESS_FORMAT =  /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;

module.exports = request => {
  let ipAddresses = (request.headers['x-forwarded-for'] || '')
    .split(',')
    .map(address => address.trim());
  ipAddresses.push(request.ip || request.connection.remoteAddress);
  ipAddresses = ipAddresses.filter(ipAddress => IPV4_ADDRESS_FORMAT.test(ipAddress));

  let clientAddressIndex = ipAddresses.length - CLIENT_IP_ADDRESS_DEPTH;
  if (clientAddressIndex < 0) {
    clientAddressIndex = 0;
  }

  return {
    addresses: ipAddresses,
    clientAddress: ipAddresses[clientAddressIndex]
  };
};


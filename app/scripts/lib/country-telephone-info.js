/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 /**
  * Country->phone number info.
  */
 define((require, exports, module) => {
   'use strict';

   module.exports = {
     UK: {
       /**
        * Format a phone phone number, expects country code prefix
        *
        * @param {String} num phone number to format.
        * @return {String} phone number formatted for country
        */
       format: (num) => {
         // +44 1234 567890
         return num.slice(0, 3) + ' ' + num.slice(3, 7) + ' ' + num.slice(7, 14);
       },
       /**
        * Pattern used for input validation
        * @type {RegExp}
        */
       pattern: /^(?:\+44)?\d{10,10}$/,
       /**
        * Country code prefix
        * @type {String}
        */
       prefix: '+44'
     },
     US: {
       format: (num) => {
         num = num.replace(/^\+1/, ''); // American's don't really know about country codes.
         // 123-456-7890
         return num.slice(0, 3) + '-' + num.slice(3, 6) + '-' + num.slice(6);
       },
       pattern: /^(?:\+1)?\d{10,10}$/,
       prefix: '+1'
     }
   };
 });

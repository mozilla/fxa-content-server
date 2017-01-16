/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 define((require, exports, module) => {
   'use strict';

   const { assert } = require('chai');
   const CountryTelephoneInfo = require('lib/country-telephone-info');

   describe('lib/country-telephone-info', () => {
     describe('UK', () => {
       let { format, pattern } = CountryTelephoneInfo.UK;

       describe('format', () => {
         it('formats correctly', () => {
           assert.equal(format('+441234567890'), '+44 1234 567890');
         });
       });

       describe('pattern', () => {
         it('validates correctly', () => {
           assert.ok(pattern.test('1234567890'));
           assert.ok(pattern.test('+441234567890'));
           assert.isFalse(pattern.test('+331234567890'));
           assert.isFalse(pattern.test('+44123456789'));
           assert.isFalse(pattern.test('123456789'));
         });
       });
     });

     describe('US', () => {
       let { format, pattern } = CountryTelephoneInfo.US;

       it('formats correctly', () => {
         assert.equal(format('+11234567890'), '123-456-7890');
         assert.equal(format('1234567890'), '123-456-7890');
       });

       describe('pattern', () => {
         it('validates correctly', () => {
           assert.ok(pattern.test('1234567890'));
           assert.ok(pattern.test('+11234567890'));
           assert.isFalse(pattern.test('+331234567890'));
           assert.isFalse(pattern.test('+1123456789'));
           assert.isFalse(pattern.test('123456789'));
         });
       });
     });
   });
 });

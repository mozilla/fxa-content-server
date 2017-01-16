/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 define((require, exports, module) => {
   'use strict';

   const { assert } = require('chai');
   const Backbone = require('backbone');
   const View = require('views/sms_sent');


   describe('views/sms_sent', () => {
     let model;
     let view;

     beforeEach(() => {
       model = new Backbone.Model({});
       view = new View({ model });
     });

     it('renders a US phone number correctly', () => {
       model.set({
         country: 'US',
         phoneNumber: '+11234567890'
       });

       return view.render()
        .then(() => {
          assert.include(view.$('#sms-sent-to').text(), '123-456-7890');
        });
     });

     it('renders a UK phone number correctly', () => {
       model.set({
         country: 'UK',
         phoneNumber: '+441234567890'
       });

       return view.render()
        .then(() => {
          assert.include(view.$('#sms-sent-to').text(), '+44 1234 567890');
        });
     });
   });
 });

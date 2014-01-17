/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// a very light wrapper around the real FxaClient to reduce boilerplate code
// and to allow us to develop to features that are not yet present in the real
// client.

'use strict';

define([
  'fxaClient',
  'jquery'
],
function (FxaClient, $) {
  var FXA_ACCOUNT_SERVER;

  // placeholder promise to stand in for FxaClient functionality that is
  // not yet ready.
  function PromiseMock() {
  }
  PromiseMock.prototype = {
    then: function (callback) {
      var promise = new PromiseMock();
      if (callback) {
        callback();
      }
      return promise;
    },
    done: function (callback) {
      if (callback) {
        callback();
      }
    }
  };

  function FxaClientWrapper() {
    this.client = new FxaClient(FXA_ACCOUNT_SERVER);
  }

  FxaClientWrapper.getAsync = function () {
    var defer = $.Deferred();

    if (FXA_ACCOUNT_SERVER) {
      defer.resolve(new FxaClientWrapper());
    } else {
      $.getJSON('/config', function (data) {
        FXA_ACCOUNT_SERVER = data.fxaccountUrl;
        defer.resolve(new FxaClientWrapper());
      });
    }

    return defer.promise();
  };

  FxaClientWrapper.prototype = {
    signIn: function (email, password) {
      return this.client.signIn(email, password, { keys: true });
    },

    signUp: function (email, password) {
      return this.client
                 .signUp(email, password)
                 .then(function () {
                    // when a user signs up, sign them in immediately
                    return this.signIn(email, password, { keys: true });
                  }.bind(this));
    },

    verifyCode: function (uid, code) {
      return this.client.verifyCode(uid, code);
    },

    requestPasswordReset: function () {
      return new PromiseMock();
    },

    completePasswordReset: function () {
      return new PromiseMock();
    }
  };

  return FxaClientWrapper;
});


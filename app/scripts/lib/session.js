/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Session saves session information about the user. Data is automatically
// saved to localStorage and automatically loaded from localStorage on startup.

'use strict';

define([
  'underscore',
  'lib/url'
], function (_, Url) {
  /*global localStorage*/
  var NAMESPACE = '__fxa_session';

  // channel is initialized on app startup
  // and should not be saved to localStorage
  var DO_NOT_PERSIST = ['channel', 'password', 'error', 'useStorage'];

  // channel should not be cleared from memory or else fxa-client.js
  // will blow up when sending the login message.
  var DO_NOT_CLEAR = ['channel', 'useStorage'];

  function Session(options) {
    options = options || {};

    if ('useStorage' in options) {
      this.useStorage = options.useStorage;
    }

    this.load();
  }

  Session.prototype = {
    constructor: Session,

    /**
     * By default, store data in localStorage
     */
    useStorage: true,

    /**
     * Load info from localStorage
     * @method load
     */
    load: function () {
      if (! this.useStorage) {
        return;
      }

      var values = {};
      try {
        values = JSON.parse(localStorage.getItem(NAMESPACE));
        this.set(values);
      } catch (e) {
        // ignore the parse error.
      }
    },

    /**
     * Set data.
     * @method set
     * can take either a key/value pair or a dictionary of key/value pairs.
     * Note: items with keys in Session.prototype cannot be overwritten.
     */
    set: function (key, value) {
      if (typeof value === 'undefined' && typeof key === 'object') {
        return _.each(key, function (value, key) {
          this.set(key, value);
        }, this);
      }

      // don't overwrite any items on the prototype.
      if (! Session.prototype.hasOwnProperty(key)) {
        this[key] = value;
        this.persist();
      }
    },

    /**
     * Persist data to localStorage if `useStorage: false` is
     * not passed to constructor.
     * @method persist
     * Note: items in DO_NOT_PERSIST are not saved to localStorage
     */
    persist: function () {
      if (! this.useStorage) {
        return;
      }

      // items on the blacklist do not get saved to localStorage.
      var toSave = {};
      _.each(this, function (value, key) {
        if (DO_NOT_PERSIST.indexOf(key) === -1) {
          toSave[key] = value;
        }
      });

      localStorage.setItem(NAMESPACE, JSON.stringify(toSave));
    },

    /**
     * Get an item
     * @method get
     */
    get: function (key) {
      return this[key];
    },

    /**
     * Remove an item or all items
     * @method clear
     * If no key specified, all items are cleared.
     * Note: items in DO_NOT_CLEAR or Session.prototype cannot be cleared
     */
    clear: function (key) {
      // no key specified, clear everything.
      if (typeof key === 'undefined') {
        for (key in this) {
          this.clear(key);
        }
        return;
      }

      if (this.hasOwnProperty(key) && DO_NOT_CLEAR.indexOf(key) === -1) {
        this[key] = null;
        delete this[key];
        this.persist();
      }
    },

    // BEGIN TEST API
    /**
     * Remove an item from memory but not localStorage. Used to test .load
     * @method testRemove
     * @private
     */
    testRemove: function (key) {
      if (this.hasOwnProperty(key)) {
        this[key] = null;
        delete this[key];
      }
    },

    /**
     * Add an item to memory and localStorage. Used to test
     * the `useStorage` option.
     * @method testSetLocalStorage
     * @private
     */
    testSetLocalStorage: function (key, value) {
      var data = {};
      data[key] = value;
      localStorage.setItem(NAMESPACE, JSON.stringify(data));
    },

    /**
     * Get backing localStorage.
     * @method testGetLocalStorage
     * @private
     */
    testGetLocalStorage: function () {
      return localStorage.getItem(NAMESPACE);
    }
    // END TEST API
  };

  function isNativeFireox() {
    return Url.searchParam('context') === 'fx_desktop_v1';
  }


  // session is a singleton
  return new Session({
    // do not load or store to localStorage if the content
    // server is viewed from `about:accounts` in Firefox.
    useStorage: !isNativeFireox()
  });

});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
  'use strict';

  var FXA_HOST = 'http://127.0.0.1:3030';

  function bind(func, context) {
    return function() {
      var args = [].slice.call(arguments, 0);
      func.apply(context, args);
    };
  }

  function defer(callback) {
    var args = [].slice.call(arguments, 1);
    setTimeout(function() {
      callback.apply(null, args);
    }, 0);
  }


  function complete(arr, val) {
    /*jshint validthis: true*/
    if (this._callbacks) {
      var info;
      /*jshint boss: true*/
      while (info = this._callbacks.shift()) {
        var promise = info.promise;
        try {
          var returnedVal = this._value;
          if (typeof info[this._state] === 'function') {
            returnedVal = info[this._state](this._value);
            if (returnedVal && typeof returnedVal.then === 'function') {
              var fulfill = bind(promise.fulfill, promise);
              var reject = bind(promise.reject, promise);
              return returnedVal.then(fulfill, reject);
            }

            defer(bind(promise.fulfill, promise), returnedVal);
          } else {
            defer(bind(promise[this._state], promise), returnedVal);
          }

        } catch(e) {
          defer(bind(promise.reject, promise), e);
        }
      }
    }
  }

  var Promise = function() {};
  Promise.prototype = {
    _state: 'pending',
    then: function(onFulfilled, onRejected) {
      if (!this._callbacks) {
        this._callbacks = [];
      }

      var returnedPromise = new Promise();

      this._callbacks.push({
        fulfill: onFulfilled,
        reject: onRejected,
        promise: returnedPromise
      });


      if (this._state === 'fulfill' || this._state === 'reject') {
        defer(bind(complete, this));
      }

      return returnedPromise;
    },

    fulfill: function(value) {
      if (this._state !== 'pending') {
        throw new Error('promise already completed');
      }

      this._value = value;
      this._state = 'fulfill';

      complete.call(this);
      return this;
    },

    reject: function(reason) {
      if (this._state !== 'pending') {
        throw new Error('promise already completed');
      }

      this._value = reason;
      this._state = 'reject';

      complete.call(this);
      return this;
    },

    otherwise: function(func) {
      return this.then(null, func);
    },

    ensure: function(func) {
      return this.then(func, func);
    }
  };


  function createElement(type, attributes) {
    var el = document.createElement(type);

    for (var attribute in attributes) {
      el.setAttribute(attribute, attributes[attribute]);
    }

    return el;
  }

  function cssPropsToString(props) {
    var str = '';

    for (var key in props) {
      str += key + ':' + props[key] + ';';
    }

    return str;
  }

  function getIframeSrc(options) {
    if (options.redirectTo) {
      return options.redirectTo;
    }
    return FXA_HOST + '/' + options.page;
  }

  function parseFxAEvent(msg) {
    var components = msg.split('!!!');
    return {
      command: components[0],
      data: JSON.parse(components[1] || '{}')
    };
  }

  function stringifyFxAEvent(command, data) {
    return command + '!!!' + JSON.stringify(data || '');
  }



  function FirefoxAccounts(options) {
    this._boundOnMessage = bind(this.onMessage, this);
    window.addEventListener('message', this._boundOnMessage, false);

    this.showFxA(options);

    // this.promise is part of the public interface.
    this.promise = new Promise();
  }

  FirefoxAccounts.prototype = {
    showFxA: function (options) {
      var background = this._backgroundEl = createElement('div', {
        style: cssPropsToString({
          background: 'rgba(0,0,0,0.5)',
          bottom: 0,
          left: 0,
          position: 'fixed',
          right: 0,
          top: 0
        })
      });


      var iframe = createElement('iframe', {
        src: getIframeSrc(options),
        width: '600',
        height: '400',
        allowtransparency: 'true',
        border: '0',
        style: cssPropsToString({
          background: 'transparent',
          border: 'none',
          display: 'block',
          height: '600px',
          margin: '0 auto 0 auto',
          position: 'relative',
          top: '10%',
          width: '400px'
        })
      });

      background.appendChild(iframe);
      document.body.appendChild(background);

      // The window where messages go
      this._contentWindow = iframe.contentWindow;
    },

    unload: function () {
      if (this._backgroundEl) {
        document.body.removeChild(this._backgroundEl);
      }

      window.removeEventListener('message', this._boundOnMessage, false);
    },

    onMessage: function (event) {
      if (event.origin !== FXA_HOST) {
        return;
      }

      var parsed = parseFxAEvent(event.data);
      var command = parsed.command;
      var data = parsed.data;

      var handler = this.commands[command] || this.commands.ignore;
      handler.call(this, command, data);
    },

    // commands that come from the iframe. They are called
    // in the FirefoxAccounts object context.
    commands: {
      cancel: function (command, data) {
        this.unload();
        this.promise.reject({ reason: 'cancel' });
      },
      error: function (command, data) {
        this.unload();
        this.promise.reject(data);
      },
      /*jshint camelcase:false*/
      ping: function () {
        console.log('received ping');
        var msg = stringifyFxAEvent('ack');

        this._contentWindow.postMessage(msg, FXA_HOST);
      },
      ignore: function (command, data) {
        console.log('ignoring command: %s', command);
      },
      oauth_complete: function (command, data) {
        this.unload();
        this.promise.fulfill({
          command: command,
          data: data
        });
      }
    }
  };

  navigator.mozAccounts = {
    get: function (options) {
      options = options || {};

      var firefoxAccounts = new FirefoxAccounts(options);
      return firefoxAccounts.promise;
    }
  };
}());

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * A channel that listens for postMessage messages on the window. This channel
 * type is meant to be subclassed and is the super for both FxDesktopChannel
 * and IFrameChannel.
 *
 * A subclass should provide strategies for the following functions:
 * - shouldAcceptMessage: Check whether a postMessage should be processed.
 * - parseMessage: Convert a postMessage into an object with two
 *   fields, command and data.
 * - isCommandSendable: Check whether a command should be dispatched to
 *   a receiver.
 * - dispatchCommand: Send a command and data to a receiver.
 *
 * All dispatched commands are assumed to require a response. If a response is
 * not received within DEFAULT_SEND_TIMEOUT_LENGTH_MS, `send` completes with an
 * `UNEXPECTED_ERROR`
 *
 * When a postMessage is recieved, the channel will use the data from
 * `parseMessage` to trigger a Backbone.Event. The event name will be the
 * command, and the data will be the data.
 */

define([
  'underscore',
  'lib/promise',
  'lib/auth-errors',
  'lib/channels/base'
], function (_, p, AuthErrors, BaseChannel) {
  var DEFAULT_SEND_TIMEOUT_LENGTH_MS = 1000;

  function noOp() {
    // it's a noOp, nothing to do.
  }

  function clearOutstandingRequest(command) {
    /*jshint validthis: true*/
    var outstandingRequest = this._outstandingRequests[command];
    if (outstandingRequest) {
      clearTimeout(outstandingRequest.timeout);
      delete this._outstandingRequests[command];
    }
    return outstandingRequest;
  }

  function setNoResponseTimeout(outstandingRequest) {
    /*jshint validthis: true*/
    outstandingRequest.timeout = setTimeout(function () {
      // only called if the request has not been responded to.
      console.log('no response');
      outstandingRequest.done(AuthErrors.toError('UNEXPECTED_ERROR'));
    }, this._sendTimeoutLength);
  }

  function receiveMessage(event) {
    /*jshint validthis: true*/

    if (! this.shouldAcceptMessage(event)) {
      return;
    }

    var components = this.parseMessage(event.data);
    if (components) {
      var command = components.command;
      var data = components.data;

      var outstandingRequest = this._outstandingRequests[command];
      if (outstandingRequest) {
        clearOutstandingRequest.call(this, command);
        outstandingRequest.done(null, data, event);
      }

      this.trigger(command, data);
    }
  }

  function PostMessageReceiverChannel() {
    // a constructor, nothing to do here.
  }

  _.extend(PostMessageReceiverChannel.prototype, new BaseChannel(), {
    /**
     * {Object} options
     * {Object} [options.window] - A window object, useful for testing.
     * {Number} [options.sendTimeoutLength] - Numer of milliseconds a response is
     * expected in.
     */
    init: function (options) {
      options = options || {};

      this._window = options.window || window;

      this._boundReceiveMessage = _.bind(receiveMessage, this);
      this._window.addEventListener('message', this._boundReceiveMessage, true);

      this._outstandingRequests = {};
      this._sendTimeoutLength = options.sendTimeoutLength || DEFAULT_SEND_TIMEOUT_LENGTH_MS;
    },

    teardown: function () {
      for (var key in this._outstandingRequests) {
        clearOutstandingRequest.call(this, key);
      }

      this._window.removeEventListener('message', this._boundReceiveMessage, false);
    },

    /**
     * check whether a postMessage message should be processed.
     * {Object} event
     */
    shouldAcceptMessage: function (/* event */) {
      throw new Error('shouldAcceptMessage must be overridden');
    },

    /**
     * parse a message that is received via postMessage
     * {String} message - message to be parsed.
     */
    parseMessage: function (/* message */) {
      throw new Error('parseMessage must be overridden');
    },

    /**
     * check if a command can be dispatched
     * {String} message - message to check.
     */
    isCommandSendable: function (/* command */) {
      return true;
    },

    /**
     * dispatch a command to a receiver.
     * {String} message - message to dispatch
     * {Object} data - data to send
     */
    dispatchCommand: function (/* message, data */) {
      throw new Error('dispatchCommand must be overridden');
    },

    /**
     * send a message, expect a response.
     *
     * All dispatched commands are assumed to require a response.
     * If a response is not received within the allowed timeframe, `done` is
     * called with an `UNEXPECTED_ERROR`
     */
    send: function (command, data, done) {
      done = done || noOp;

      if (this.isCommandSendable(command)) {
        var outstanding = this._outstandingRequests[command];
        if (outstanding) {
          clearOutstandingRequest.call(this, command);
        }

        outstanding = this._outstandingRequests[command] = {
          done: done,
          command: command,
          data: data
        };

        setNoResponseTimeout.call(this, outstanding);

        try {
          // Browsers can blow up dispatching the event.
          // Ignore the blowups and return without retrying.
          this.dispatchCommand(command, data);
        } catch (e) {
          // something went wrong sending the message and we are not going to
          // retry, no need to keep track of it any longer.
          clearOutstandingRequest.call(this, command);
          return done(e);
        }

        return;
      }

      done();
    }
  });

  return PostMessageReceiverChannel;
});


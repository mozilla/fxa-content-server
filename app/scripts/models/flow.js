/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A model to represent the somewhat nebulous concept of an
 * "event flow". A single flow could be a user connecting a
 * new device to their Sync account, for instance.
 *
 * Each flow has two properties.
 *
 *   * flowId: 32-byte identifier hex-encoded as a string.
 *   * flowBeginTime: server-generated timestamp.
 *
 * When a new flow is begun, it should result in an activity
 * event being logged by the server. To that end, we push a
 * a `flow.begin` onto the metrics event array.
 *
 * There is some mess surrounding when to begin a new flow,
 * which necessitates equivalent mess in this model. It runs
 * something like this:
 *
 *   1. A user arriving at /signin or /signup constitutes the
 *      beginning of a flow, so a corresponding `flow.begin`
 *      event must be logged.
 *
 *   2. A user refreshing the page on /signin or /signup does
 *      not constitute a new flow, so events must not be logged
 *      in those cases. This is achieved by saving the flowId
 *      in local storage.
 *
 *   3. If a user signs in, then signs out, then signs in again,
 *      the second sign-in does count as a new flow, so a second
 *      `flow.begin` event must be logged. This is achieved by
 *      clearing the model and local storage when a user is signed
 *      out. Also note that in this case, since the navigation may
 *      have occurred entirely on the client, we might not have a
 *      server-generated flowBeginTime and must estimate the time
 *      instead.
 *
 *   4. If a user signs up on device A then confirms their email
 *      address on device B, the flow id must follow them onto
 *      the new device so that it can be propagated in requests
 *      to the auth server. This is achieved by also setting flowId
 *      as a property of the user model, which is serialised into
 *      the resume token.
 */

define(function (require, exports, module) {
  'use strict';

  var _ = require('underscore');
  var Backbone = require('backbone');
  var Cocktail = require('cocktail');
  var ResumeTokenMixin = require('models/mixins/resume-token');
  var SearchParamMixin = require('models/mixins/search-param');
  var Storage = require('lib/storage');
  var uuid = require('uuid');
  var vat = require('lib/vat');

  var STRATEGIES = [
    populateFromResumeToken,
    populateFromLocalStorage,
    createFresh
  ];

  function populateFromResumeToken () {
    this.populateFromStringifiedResumeToken(this.getSearchParam('resume'));
  }

  function populateFromLocalStorage () {
    var flowId = this._storage.get('flowId');
    if (flowId) {
      this.set('flowId', flowId);
    }
  }

  function createFresh () {
    this.set('flowId', (uuid.v4() + uuid.v4()).replace(/-/g, ''));
  }

  var FlowModel = Backbone.Model.extend({
    defaults: { flowId: null },
    resumeTokenFields: [ 'flowId' ],
    resumeTokenSchema: { flowId: vat.hex().len(64) },

    initialize: function (options) {
      options = options || {};

      this._storage = options.storage || Storage.factory('localStorage', this.window);
      this._metrics = options.metrics;
      this.window = options.window || window;
    },

    // Called after a user lands on /signin or /signup. Logs
    // a `flow.begin` event if no flowId is found on the resume
    // token or in local storage.
    begin: function (time) {
      var self = this;
      var activeStrategy;

      _.some(STRATEGIES, function (strategy) {
        strategy.call(self);
        activeStrategy = strategy;
        return self.has('flowId');
      });

      if (activeStrategy === createFresh) {
        this._metrics.logFlowBegin(this.get('flowId'), time || undefined);
      }

      this._storage.set('flowId', this.get('flowId'));
    },

    // Called after a user is signed out. Ensures that the next
    // sign-in/up will log a fresh `flow.begin` event.
    end: function () {
      this.clear();
      this._storage.remove('flowId');
    }
  });

  Cocktail.mixin(
    FlowModel,
    ResumeTokenMixin,
    SearchParamMixin
  );

  module.exports = FlowModel;
});

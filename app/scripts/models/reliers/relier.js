/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A relier is a model that holds information about the RP.
 */

'use strict';

define([
  'underscore',
  'models/reliers/base',
  'models/mixins/search-param',
  'lib/promise',
  'lib/resume-token',
  'lib/constants'
], function (_, BaseRelier, SearchParamMixin, p, ResumeToken, Constants) {

  var Relier = BaseRelier.extend({
    defaults: {
      service: null,
      preVerifyToken: null,
      email: null,
      allowCachedCredentials: true,
      metrics: null,
      entrypoint: null,
      campaign: null
    },

    initialize: function (options) {
      options = options || {};

      this.window = options.window || window;
    },

    /**
     * Fetch hydrates the model. Returns a promise to allow
     * for an asynchronous load. Sub-classes that override
     * fetch should still call Relier's version before completing.
     *
     * e.g.
     *
     * fetch: function () {
     *   return Relier.prototype.fetch.call(this)
     *       .then(function () {
     *         // do overriding behavior here.
     *       });
     * }
     */
    fetch: function () {
      var self = this;
      return p()
        .then(function () {
          self._parseResumeToken();
          self.importSearchParam('service');
          self.importSearchParam('preVerifyToken');
          self.importSearchParam('uid');
          self.importSearchParam('setting');
          self.importSearchParam('entrypoint');
          self.importSearchParam('campaign');

          // A relier can indicate they do not want to allow
          // cached credentials if they set email === 'blank'
          if (self.getSearchParam('email') ===
              Constants.DISALLOW_CACHED_CREDENTIALS) {
            self.set('allowCachedCredentials', false);
          } else {
            self.importSearchParam('email');
          }
        });
    },

    /**
     * Check if the relier is Sync for Firefox Desktop
     */
    isSync: function () {
      return this.get('service') === Constants.FX_DESKTOP_SYNC;
    },

    /**
     * We should always fetch keys for sync.  If the user verifies in a
     * second tab on the same browser, the context will not be available,
     * but we will need to ship the keyFetchToken and unwrapBKey over to
     * the first tab.
     */
    wantsKeys: function () {
      return this.isSync();
    },

    /**
     * Check if the relier allows cached credentials. A relier
     * can set email=blank to indicate they do not.
     */
    allowCachedCredentials: function () {
      return this.get('allowCachedCredentials');
    },

    /**
     * Creates a resume token from subset of model fields.
     */
    getResumeToken: function () {
      var resumeObj = {};
      var fieldCount = 0;

      _.each(this.getRelierFieldsInResumeToken(), function (itemName) {
        if (this.has(itemName)) {
          resumeObj[itemName] = this.get(itemName);
          fieldCount++;
        }
      }, this);

      if (fieldCount === 0) {
        return null;
      }
      return ResumeToken.stringify(resumeObj);
    },

    getRelierFieldsInResumeToken: function () {
      return ['metrics', 'campaign', 'entrypoint'];
    },

    /**
     * Sets relier properties from the resume token value
     * @private
     */
    _parseResumeToken: function () {
      var resumeToken = this.getSearchParam('resume');
      var parsedResumeToken = ResumeToken.parse(resumeToken);

      if (parsedResumeToken) {
        _.each(this.getRelierFieldsInResumeToken(), function (itemName) {
          if (Object.prototype.hasOwnProperty.call(parsedResumeToken, itemName)) {
            this.set(itemName, parsedResumeToken[itemName]);
          }
        }, this);
      }
    }

  });

  _.extend(Relier.prototype, SearchParamMixin);

  return Relier;
});

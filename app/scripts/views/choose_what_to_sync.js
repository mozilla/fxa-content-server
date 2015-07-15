/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'views/form',
  'stache!templates/choose_what_to_sync',
  'lib/promise'
],
function (_, FormView, Template, p) {
  'use strict';

  var View = FormView.extend({
    template: Template,
    className: 'choose-what-to-sync',

    initialize: function () {
      // Account data is passed in from sign up flow.
      var data = this.ephemeralData();
      if (! data || ! data.account || ! data.account.get('email')) {
        this.navigate('signup');
      }

      this._account = data && this.user.initAccount(data.account);
    },

    getAccount: function () {
      return this._account;
    },

    context: function () {
      var account = this.getAccount();

      return {
        email: account.get('email')
      };
    },

    submit: function () {
      var self = this;
      var account = self.getAccount();
      var declinedEngines = self._getDeclinedEngines();
      this._trackUncheckedEngines(declinedEngines);
      account.set('declinedSyncEngines', declinedEngines);
      account.set('customizeSync', true);
      self.logScreenEvent('submit');

      return p().then(function () {
        self.user.setAccount(account);

        return self.onSignUpSuccess(account);
      });
    },

    /**
     * Get sync engines that were declined by unchecked checkboxes
     *
     * @returns {Array}
     * @private
     */
    _getDeclinedEngines: function () {
      return this.$el.find('input[name=sync-content]').not(':checked').map(function () {
        return this.value;
      }).get();
    },

    /**
     * Keep track of what sync engines the user declines
     *
     * @param {Array} declinedEngines
     * @private
     */
    _trackUncheckedEngines: function (declinedEngines) {
      var self = this;

      if (_.isArray(declinedEngines)) {
        declinedEngines.forEach(function (engine) {
          // TODO: underscores or dashes or dots for this event?
          self.logScreenEvent('engine_unchecked.' + engine);
        });
      }
    },

    onSignUpSuccess: function (account) {
      var self = this;
      if (account.get('verified')) {
        // user was pre-verified, notify the broker.
        return self.broker.afterSignIn(account)
          .then(function (result) {
            if (! (result && result.halt)) {
              self.navigate('signup_complete');
            }
          });
      } else {
        self.navigate('confirm', {
          data: {
            account: account
          }
        });
      }
    }

  });

  return View;
});

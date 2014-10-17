/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'underscore',
  'views/form',
  'views/base',
  'stache!templates/confirm',
  'lib/session',
  'lib/promise',
  'lib/auth-errors',
  'views/mixins/resend-mixin',
  'views/mixins/service-mixin'
],
function (_, FormView, BaseView, Template, Session, p, AuthErrors,
    ResendMixin, ServiceMixin) {
  var VERIFICATION_POLL_IN_MS = 4000; // 4 seconds

  var View = FormView.extend({
    template: Template,
    className: 'confirm',

    // used by unit tests
    VERIFICATION_POLL_IN_MS: VERIFICATION_POLL_IN_MS,

    initialize: function () {
      this.account = this.currentAccount();
    },

    context: function () {
      return {
        email: this.account && this.account.email
      };
    },

    events: {
      // validateAndSubmit is used to prevent multiple concurrent submissions.
      'click #resend': BaseView.preventDefaultThen('validateAndSubmit')
    },

    beforeRender: function () {
      // user cannot confirm if they have not initiated a sign up.
      if (! this.account || ! this.account.sessionToken) {
        this.navigate('signup');
        return false;
      }
    },

    afterRender: function () {
      var graphic = this.$el.find('.graphic');
      graphic.addClass('pulse');

      var self = this;
      return self.broker.persist()
        .then(function () {
          self._waitForConfirmation()
            .then(function () {
              return self.broker.afterSignUpConfirmationPoll();
            })
            .then(function (result) {
              if (! (result && result.halt)) {
                self.navigate('signup_complete');
              }
            }, function (err) {
              self.displayError(err);
            });
        });
    },

    _waitForConfirmation: function () {
      var self = this;
      return self.fxaClient.recoveryEmailStatus(self.account.sessionToken)
        .then(function (result) {
          if (result.verified) {
            self.account.verified = true;
            self.user.setAccount(self.account);
            return true;
          }

          var deferred = p.defer();

          // _waitForConfirmation will return a promise and the
          // promise chain remains unbroken.
          self.setTimeout(function () {
            deferred.resolve(self._waitForConfirmation());
          }, self.VERIFICATION_POLL_IN_MS);

          return deferred.promise;
        });
    },

    submit: function () {
      var self = this;

      self.logScreenEvent('resend');
      return self.fxaClient.signUpResend(self.relier, self.account.sessionToken)
              .then(function () {
                self.displaySuccess();
              }, function (err) {
                if (AuthErrors.is(err, 'INVALID_TOKEN')) {
                  return self.navigate('signup', {
                    error: err
                  });
                }

                // unexpected error, rethrow for display.
                throw err;
              });
    }
  });

  _.extend(View.prototype, ResendMixin, ServiceMixin);

  return View;
});

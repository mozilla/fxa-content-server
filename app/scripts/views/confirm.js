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
  'lib/auth-errors',
  'lib/channels',
  'lib/promise',
  'views/mixins/resend-mixin',
  'views/mixins/service-mixin'
],
function (_, FormView, BaseView, Template, Session, AuthErrors,
      Channels, p, ResendMixin, ServiceMixin) {
  var VERIFICATION_POLL_IN_MS = 4000; // 4 seconds

  // Some environments, like the IFRAME'd FxA, require the OAuth
  // credentials be sent back to the RP without user interaction.
  function shouldFinishOAuthFlow() {
    /*jshint validthis: true*/
    return Channels.sendExpectResponse(
        'should_original_tab_finish_oauth_flow_on_verification', null,
        { window: this.window, channel: this._channel });
  }

  var View = FormView.extend({
    initialize: function (options) {
      options = options || {};

      this._channel = options.channel;
    },

    template: Template,
    className: 'confirm',

    // used by unit tests
    VERIFICATION_POLL_IN_MS: VERIFICATION_POLL_IN_MS,

    context: function () {
      return {
        email: Session.email
      };
    },

    events: {
      // validateAndSubmit is used to prevent multiple concurrent submissions.
      'click #resend': BaseView.preventDefaultThen('validateAndSubmit')
    },

    beforeRender: function () {
      // user cannot confirm if they have not initiated a sign up.
      if (! Session.sessionToken) {
        this.navigate('signup');
        return false;
      }
    },

    afterRender: function() {
      var graphic = this.$el.find('.graphic');
      graphic.addClass('pulse');

      // If we're in an OAuth flow, start polling the user's verification
      // status and transistion to the signup complete screen to complete the flow
      if (this.isOAuth()) {
        var self = this;
        var pollFn = function () {
          self.fxaClient.recoveryEmailStatus(Session.sessionToken)
            .then(function (result) {
              if (result.verified) {
                shouldFinishOAuthFlow.call(self)
                  .then(function (shouldFinishOAuthFlow) {
                    if (shouldFinishOAuthFlow) {
                      self.setupOAuth();
                      self.finishOAuthFlow({
                        source: 'sign_up'
                      });
                    } else {
                      self.navigate('signup_complete');
                    }
                  })
                  .fail(_.bind(self.displayError, self));
              } else {
                self.setTimeout(pollFn, self.VERIFICATION_POLL_IN_MS);
              }
            });
        };

        this.setTimeout(pollFn, self.VERIFICATION_POLL_IN_MS);
      }
    },

    submit: function () {
      var self = this;

      self.logEvent('confirm:resend');
      return this.fxaClient.signUpResend()
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

  _.extend(View.prototype, ResendMixin);
  _.extend(View.prototype, ServiceMixin);

  return View;
});

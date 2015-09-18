/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'cocktail',
  'views/confirm',
  'views/base',
  'stache!templates/confirm_reset_password',
  'lib/promise',
  'lib/session',
  'lib/auth-errors',
  'views/mixins/resend-mixin',
  'views/mixins/resume-token-mixin',
  'views/mixins/service-mixin'
],
function (Cocktail, ConfirmView, BaseView, Template, p, Session, AuthErrors,
      ResendMixin, ResumeTokenMixin, ServiceMixin) {
  'use strict';

  var t = BaseView.t;

  var LOGIN_MESSAGE_TIMEOUT_MS = 10000;

  var View = ConfirmView.extend({
    template: Template,
    className: 'confirm-reset-password',

    initialize: function (options) {
      options = options || {};
      this._interTabChannel = options.interTabChannel;
      this._loginMessageTimeoutMS = options.loginMessageTimeoutMS ||
              LOGIN_MESSAGE_TIMEOUT_MS;
      this._verificationPollMS = options.verificationPollMS ||
              this.VERIFICATION_POLL_IN_MS;


      var data = this.ephemeralData();
      this._email = data.email;
      this._passwordForgotToken = data.passwordForgotToken;
    },

    events: {
      'click #resend': BaseView.preventDefaultThen('validateAndSubmit')
    },

    context: function () {
      return {
        email: this._email,
        encodedEmail: encodeURIComponent(this._email),
        forceAuth: this.broker.isForceAuth()
      };
    },

    beforeRender: function () {
      // user cannot confirm if they have not initiated a reset password
      if (! this._passwordForgotToken) {
        this.navigate('reset_password');
        return false;
      }
    },

    _getSignInRoute: function () {
      if (this.relier.isOAuth()) {
        return 'oauth/signin';
      }
      return 'signin';
    },

    afterRender: function () {
      var bounceGraphic = this.$el.find('.graphic');
      bounceGraphic.addClass('pulse');
      var self = this;

      if (self.relier.isOAuth()) {
        this.transformLinks();
      }

      // this sequence is a bit tricky and needs to be explained.
      //
      // For OAuth and Sync, we are trying to make it so users who complete
      // the password reset flow in another tab of the same browser are
      // able to finish signing in if the original tab is still open.
      // After requesting the password reset, the original tab sits and polls
      // the server querying whether the password reset is complete.
      //
      // This crypto stuff needs to occur in the original tab because OAuth
      // reliers and sync may only have the appropriate state in the original
      // tab. This means, for password reset, we have to ship information like
      // the unwrapBKey and keyFetchToken from tab 2 to tab 1. We have a plan,
      // albeit a complex one.
      //
      // In tab 2, two auth server calls are made after the user
      // fills out the new passwords and submits the form:
      //
      // 1. /account/reset
      // 2. /account/login
      //
      // The first call resets the password, the second signs the user in
      // so that Sync/OAuth key/code generation can occur.
      //
      // tab 1 will be notified that the password reset is complete
      // after step 1. The problem is, tab 1 can only do its crypto
      // business after step 2 and after the information has been shipped from
      // tab 2 to tab 1.
      //
      // To communicate between tabs, a special channel is set up that makes
      // use of localStorage as the comms medium. When tab 1 starts its poll,
      // it also starts listening for messages on localStorage. This is in
      // case the tab 2 finishes both #1 and #2 before the poll completes.
      // If a message is received by time the poll completes, take the
      // information from the message and sign the user in.
      //
      // If a message has not been received by time the poll completes,
      // assume we are either in a second browser or in between steps #1 and
      // #2. Start a timeout in case the user verifies in a second browser
      // and the message is never received. If the timeout is reached,
      // force a manual signin of the user.
      //
      // If a message is received before the timeout hits, HOORAY!
      return self.broker.persist()
        .then(function () {
          self._waitForConfirmation()
            .then(function (sessionInfo) {
              self.logScreenEvent('verification.success');
              // The original window should finish the flow if the user
              // completes verification in the same browser and has sessionInfo
              // passed over from tab 2.
              if (sessionInfo) {
                return self._finishPasswordResetSameBrowser(sessionInfo);
              }

              return self._finishPasswordResetDifferentBrowser();
            })
            .fail(function (err) {
              self.displayError(err);
            });
        });
    },

    _waitForConfirmation: function () {
      var self = this;
      var confirmationDeferred = p.defer();
      var confirmationPromise = confirmationDeferred.promise;
      self._confirmationPromise = confirmationPromise;

      // If either the `login` message comes through or the `login` message
      // timeout elapses after the server confirms the user is verified,
      // stop waiting all together and move to the next screen.
      function onComplete(response) {
        self._stopWaiting();
        confirmationDeferred.resolve(response);
      }

      function onError(err) {
        self._stopWaiting();
        confirmationDeferred.reject(err);
      }

      self._waitForLoginMessage().then(onComplete, onError);

      self._waitForServerConfirmation()
        .then(function (isVerified) {
          if (self._isStillWaiting() && isVerified) {
            // server indicates the user has been verified and the `login`
            // message has not arrived from another tab. Wait a short
            // period of time for the `login` message. If the timeout
            // elapses, assume the user verified in a different browser.
            return self._startWaitForLoginMessageTimeout()
              .then(onComplete.bind(null, null));
          }
        }).fail(onError);

      return confirmationPromise;
    },

    _finishPasswordResetSameBrowser: function (sessionInfo) {
      var self = this;
      var account = self.user.initAccount(sessionInfo);

      // The OAuth flow needs the sessionToken to finish the flow.
      return self.user.setSignedInAccount(account)
        .then(function () {
          self.displaySuccess(t('Password reset'));

          return self.broker.afterResetPasswordConfirmationPoll(account)
            .then(function (result) {
              if (result && result.halt) {
                return;
              }

              if (self.relier.isDirectAccess()) {
                // user is most definitely signed in since sessionInfo
                // was passed in. Just ship direct access users to /settings
                self.navigate('settings', {
                  success: t('Account verified successfully')
                });
              } else {
                self.navigate('reset_password_complete');
              }
            });
        });
    },

    _finishPasswordResetDifferentBrowser: function () {
      var self = this;
      // user verified in a different browser, make them sign in. OAuth
      // users will be redirected back to the RP, Sync users will be
      // taken to the Sync controlled completion page.
      Session.clear();
      self.navigate(self._getSignInRoute(), {
        success: t('Password reset successfully. Sign in to continue.')
      });
    },

    _waitForServerConfirmation: function () {
      var self = this;
      // only check if still waiting.
      if (self._isStillWaiting()) {
        return self.fxaClient.isPasswordResetComplete(self._passwordForgotToken)
          .then(function (isComplete) {
            if (isComplete) {
              return true;
            } else if (! self._isStillWaiting()) {
              // If the `login` message came through while the XHR request was
              // outstanding, no need to check again.
              return false;
            }

            var deferred = p.defer();
            self._waitForServerConfirmationTimeout = self.setTimeout(function () {
              deferred.resolve(self._waitForServerConfirmation());
            }, self._verificationPollMS);

            return deferred.promise;
          });
      }
    },

    _waitForLoginMessage: function () {
      var deferred = p.defer();

      var onLogin = function (event) {
        deferred.resolve(event && event.data);
      };

      this._loginMessageRemoveListenerKey =
          this._interTabChannel.on('login', onLogin);

      return deferred.promise;
    },

    _startWaitForLoginMessageTimeout: function () {
      var deferred = p.defer();

      this._waitForLoginMessageTimeout =
            this.setTimeout(deferred.resolve.bind(deferred),
                this._loginMessageTimeoutMS);

      return deferred.promise;
    },

    _isStillWaiting: function () {
      var confirmationPromise = this._confirmationPromise;
      return !! confirmationPromise &&
                confirmationPromise.inspect().state === 'pending';
    },

    _stopWaiting: function () {
      var self = this;

      if (self._waitForServerConfirmationTimeout) {
        self.clearTimeout(self._waitForServerConfirmationTimeout);
      }

      if (self._waitForLoginMessageTimeout) {
        self.clearTimeout(self._waitForLoginMessageTimeout);
      }

      self._interTabChannel.off('login', self._loginMessageRemoveListenerKey);
      // Sensitive data is passed between tabs using localStorage.
      // Delete the data from storage as soon as possible.
      self._interTabChannel.clearMessages();
    },

    submit: function () {
      var self = this;
      self.logScreenEvent('resend');

      return self.fxaClient.passwordResetResend(
        self._email,
        self._passwordForgotToken,
        self.relier,
        {
          resume: self.getStringifiedResumeToken()
        }
      )
      .then(function () {
        self.displaySuccess();
      })
      .fail(function (err) {
        if (AuthErrors.is(err, 'INVALID_TOKEN')) {
          return self.navigate('reset_password', {
            error: err
          });
        }

        // unexpected error, rethrow for display.
        throw err;
      });
    },

    // The ResendMixin overrides beforeSubmit. Unless set to undefined,
    // Cocktail runs both the original version and the overridden version.
    beforeSubmit: undefined
  });

  Cocktail.mixin(
    View,
    ResendMixin,
    ResumeTokenMixin,
    ServiceMixin
  );

  return View;
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'cocktail',
  'lib/promise',
  'views/base',
  'views/form',
  'stache!templates/sign_in',
  'lib/session',
  'lib/auth-errors',
  'views/mixins/password-mixin',
  'views/mixins/resume-token-mixin',
  'views/mixins/service-mixin',
  'views/mixins/signup-disabled-mixin',
  'views/mixins/avatar-mixin',
  'views/mixins/account-locked-mixin',
  'views/mixins/migration-mixin',
  'views/decorators/allow_only_one_submit',
  'views/decorators/progress_indicator'
],
function (Cocktail, p, BaseView, FormView, SignInTemplate, Session,
  AuthErrors, PasswordMixin, ResumeTokenMixin, ServiceMixin,
  SignupDisabledMixin, AvatarMixin, AccountLockedMixin, MigrationMixin,
  allowOnlyOneSubmit, showProgressIndicator) {

  'use strict';

  let t = BaseView.t;

  let View = FormView.extend({
    template: SignInTemplate,
    className: 'sign-in',

    initialize (options = {}) {
      this._formPrefill = options.formPrefill;
      let data = this.ephemeralData();
      if (data) {
        this._redirectTo = data.redirectTo;
      }
    },

    beforeRender () {
      this._account = this._suggestedAccount();
    },

    getAccount () {
      return this._account;
    },

    getPrefillEmail () {
      // formPrefill.email comes first because users can edit the email,
      // go to another screen, edit the email again, and come back here. We
      // want the last used email.
      return this._formPrefill.get('email') || this.relier.get('email');
    },

    context () {
      let suggestedAccount = this.getAccount();
      let hasSuggestedAccount = suggestedAccount.get('email');
      let email = hasSuggestedAccount ?
                    suggestedAccount.get('email') : this.getPrefillEmail();

      return {
        serviceName: this.relier.get('serviceName'),
        isPasswordAutoCompleteDisabled: this.isPasswordAutoCompleteDisabled(),
        email: email,
        suggestedAccount: hasSuggestedAccount,
        chooserAskForPassword: this._suggestedAccountAskPassword(suggestedAccount),
        password: this._formPrefill.get('password'),
        error: this.error,
        isMigration: this.isMigration(),
        isSignupDisabled: this.isSignupDisabled()
      };
    },

    events: {
      'click .use-logged-in': 'useLoggedInAccount',
      'click .use-different': 'useDifferentAccount'
    },

    afterRender () {
      this.transformLinks();
      return FormView.prototype.afterRender.call(this);
    },

    afterVisible () {
      FormView.prototype.afterVisible.call(this);
      return this.displayAccountProfileImage(this.getAccount());
    },

    beforeDestroy () {
      this._formPrefill.set('email', this.getElementValue('.email'));
      this._formPrefill.set('password', this.getElementValue('.password'));
    },

    submit () {
      let account = this.user.initAccount({
        email: this.getElementValue('.email'),
        password: this.getElementValue('.password')
      });

      return this._signIn(account);
    },

    /**
     *
     * @param {Account} account
     *     The account instance should either include a password or a sessionToken
     *     @param {String} account.password
     *     User password from the input
     *     @param {String} account.sessionToken
     *     Session token from the account
     * @private
     */
    _signIn (account) {
      let self = this;
      if (! account || account.isDefault()) {
        return p.reject(AuthErrors.toError('UNEXPECTED_ERROR'));
      }

      return self.broker.beforeSignIn(account.get('email'))
        .then(() => {
          return self.user.signInAccount(account, self.relier, {
            // a resume token is passed in to handle unverified users.
            resume: self.getStringifiedResumeToken()
          });
        })
        .then((account) => {
          // formPrefill information is no longer needed after the user
          // has successfully signed in. Clear the info to ensure
          // passwords aren't sticking around in memory.
          self._formPrefill.clear();

          if (self.relier.accountNeedsPermissions(account)) {
            self.navigate('signin_permissions', {
              data: {
                account: account
              }
            });

            return false;
          }

          if (account.get('verified')) {
            return self.onSignInSuccess(account);
          }

          return self.onSignInUnverified(account);
        })
        .fail(self.onSignInError.bind(self, account));
    },

    onSignInError (account, err) {
      let self = this;

      if (AuthErrors.is(err, 'UNKNOWN_ACCOUNT') && ! this.isSignupDisabled()) {
        return self._suggestSignUp(err);
      } else if (AuthErrors.is(err, 'USER_CANCELED_LOGIN')) {
        self.logScreenEvent('canceled');
        // if user canceled login, just stop
        return;
      } else if (AuthErrors.is(err, 'ACCOUNT_LOCKED')) {
        return self.notifyOfLockedAccount(account);
      }
      // re-throw error, it will be handled at a lower level.
      throw err;
    },

    onSignInSuccess (account) {
      let self = this;
      self.logScreenEvent('success');
      return self.broker.afterSignIn(account)
        .then((result) => {
          if (! (result && result.halt)) {
            self.navigate(self._redirectTo || 'settings');
          }

          return result;
        });
    },

    onSignInUnverified (account) {
      this.navigate('confirm', {
        data: {
          account: account
        }
      });
    },

    _suggestSignUp (err) {
      err.forceMessage = t('Unknown account. <a href="/signup">Sign up</a>');
      return this.displayErrorUnsafe(err);
    },

    /**
     * Used for the special "Sign In" button
     * which is present when there is already a logged in user in the session
     */
    useLoggedInAccount: allowOnlyOneSubmit(showProgressIndicator(function () {
      let self = this;
      let account = this.getAccount();

      return this._signIn(account)
        .fail(() => {
          self.chooserAskForPassword = true;
          return self.render()
            .then(() => {
              self.user.removeAccount(account);
              return self.displayError(AuthErrors.toError('SESSION_EXPIRED'));
            });
        });
    })),

    /**
     * Render to a basic sign in view, used with "Use a different account" button
     */
    useDifferentAccount: BaseView.preventDefaultThen(function () {
      // TODO when the UI allows removal of individual accounts,
      // only clear the current account.
      this.user.removeAllAccounts();
      Session.clear();
      this._formPrefill.clear();
      this.logScreenEvent('use-different-account');

      return this.render();
    }),

    /**
     * Determines if the user should be suggested for the signin flow.
     *
     * @returns {Object|null}
     *          Returns user information if the user should be suggested
     *          Returns "null" if the current signin view must not suggest users.
     * @private
     */
    _suggestedAccount () {
      let account = this.user.getChooserAccount();
      let prefillEmail = this.getPrefillEmail();

      if (
        // the relier can overrule cached creds.
        this.relier.allowCachedCredentials() &&
        // confirm that session email is present
        account.get('email') && account.get('sessionToken') &&
        // prefilled email must be the same or absent
        (prefillEmail === account.get('email') || ! prefillEmail)
      ) {
        return account;
      } else {
        return this.user.initAccount();
      }
    },

    /**
     * Determines if the suggested user must be asked for a password.
     * @private
     */
    _suggestedAccountAskPassword (account) {
      // If there's no email, obviously we'll have to ask for the password.
      if (! account.get('email')) {
        this.logScreenEvent('ask-password.shown.account-unknown');
        return true;
      }

      // If the relier wants keys, then the user must authenticate and the password must be requested.
      // This includes sync, which must skip the login chooser at all cost
      if (this.relier.wantsKeys()) {
        this.logScreenEvent('ask-password.shown.keys-required');
        return true;
      }

      // We need to ask the user again for their password unless the credentials came from Sync.
      // Otherwise they aren't able to "fully" log out. Only Sync has a clear path to disconnect/log out
      // your account that invalidates your sessionToken.
      if (! this.user.isSyncAccount(account)) {
        this.logScreenEvent('ask-password.shown.session-from-web');
        return true;
      }

      // Ask when 'chooserAskForPassword' is explicitly set.
      // This happens in response to an expired session token.
      if (this.chooserAskForPassword === true) {
        this.logScreenEvent('ask-password.shown.session-expired');
        return true;
      }

      // Ask when a prefill email does not match the account email.
      let prefillEmail = this.getPrefillEmail();
      if (prefillEmail && prefillEmail !== account.get('email')) {
        this.logScreenEvent('ask-password.shown.email-mismatch');
        return true;
      }

      // If none of that is true, it's safe to proceed without asking for the password.
      this.logScreenEvent('ask-password.skipped');
      return false;
    }
  });

  Cocktail.mixin(
    View,
    AccountLockedMixin,
    AvatarMixin,
    MigrationMixin,
    PasswordMixin,
    ResumeTokenMixin,
    ServiceMixin,
    SignupDisabledMixin
  );

  return View;
});

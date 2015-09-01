/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'cocktail',
  'underscore',
  'lib/promise',
  'views/base',
  'views/form',
  'stache!templates/sign_up',
  'lib/auth-errors',
  'lib/mailcheck',
  'lib/url',
  'views/mixins/experiment-mixin',
  'views/mixins/password-mixin',
  'views/mixins/password-strength-mixin',
  'views/mixins/service-mixin',
  'views/mixins/checkbox-mixin',
  'views/mixins/resume-token-mixin',
  'views/mixins/migration-mixin',
  'views/mixins/signup-disabled-mixin',
  'views/coppa/coppa-date-picker',
  'views/coppa/coppa-age-input'
],
function (Cocktail, _, p, BaseView, FormView, Template, AuthErrors, mailcheck, Url,
      ExperimentMixin, PasswordMixin, PasswordStrengthMixin, ServiceMixin, CheckboxMixin, ResumeTokenMixin,
      MigrationMixin, SignupDisabledMixin, CoppaDatePicker, CoppaAgeInput) {
  'use strict';

  let t = BaseView.t;

  function selectAutoFocusEl(bouncedEmail, email, password) {
    if (bouncedEmail) {
      return 'email';
    } else if (! email) {
      return 'email';
    } else if (! password) {
      return 'password';
    }
    return null;
  }

  let View = FormView.extend({
    template: Template,
    className: 'sign-up',

    initialize (options = {}) {
      this._formPrefill = options.formPrefill;
      this._coppa = options.coppa;
      this._able = options.able;
    },

    beforeRender () {
      if (document.cookie.indexOf('tooyoung') > -1) {
        this.navigate('cannot_create_account');
        return p(false);
      } else if (this.isSignupDisabled()) {
        this.navigate('signin', {
          error: this.getSignupDisabledReason()
        });
        return p(false);
      }

      this._bouncedEmail = this.ephemeralMessages.get('bouncedEmail');
      return FormView.prototype.beforeRender.call(this);
    },

    _createCoppaView () {
      let self = this;

      if (self._coppa) {
        return p();
      }

      let autofocusEl = this._selectAutoFocusEl();
      let coppaView;
      let coppaOptions = {
        el: self.$('#coppa'),
        metrics: self.metrics,
        screenName: self.getScreenName(),
        formPrefill: self._formPrefill,
        shouldFocus: autofocusEl === null
      };

      if (self.isInExperiment('coppaView')) {
        self.notify('coppaView.triggered');

        if (self.isInExperimentGroup('coppaView', 'treatment')) {
          coppaView = new CoppaAgeInput(coppaOptions);
        } else {
          coppaView = new CoppaDatePicker(coppaOptions);
        }
      } else {
        coppaView = new CoppaDatePicker(coppaOptions);
      }

      return coppaView.render()
        .then(function () {
          self.trackSubview(coppaView);
          coppaView.on('submit', self.validateAndSubmit.bind(self));

          self._coppa = coppaView;
        });
    },

    afterRender () {
      let self = this;

      self.logScreenEvent('email-optin.visible.' +
          String(self._isEmailOptInEnabled()));

      self._createCoppaView()
        .then(() => {
          self.transformLinks();

          return FormView.prototype.afterRender.call(self);
        });
    },

    afterVisible () {
      if (this._bouncedEmail) {
        this.showValidationError('input[type=email]',
                  AuthErrors.toError('SIGNUP_EMAIL_BOUNCE'));
      }

      if (this.broker.isAutomatedBrowser()) {
        // helps avoid 'focus' issues with Firefox Selenium Driver
        // See https://code.google.com/p/selenium/issues/detail?id=157
        this.$el.find('input[type=password]').click(function () {
          this.onEmailBlur();
        }.bind(this));
      }

      if (this.isPasswordStrengthCheckEnabled()) {
        // load the password strength checker early so the user does
        // not need to wait once they fill out the password.
        this.getPasswordStrengthChecker();
      }

      return FormView.prototype.afterVisible.call(this);
    },

    events: {
      'blur input.email': 'onEmailBlur',
      'blur input.password': 'onPasswordBlur'
    },

    getPrefillEmail () {
      // formPrefill.email comes first because users can edit the email,
      // go to another screen, edit the email again, and come back here. We
      // want the last used email.
      return this._formPrefill.get('email') || this.relier.get('email');
    },

    _selectAutoFocusEl () {
      let prefillEmail = this.getPrefillEmail();
      let prefillPassword = this._formPrefill.get('password');

      return selectAutoFocusEl(
            this._bouncedEmail, prefillEmail, prefillPassword);
    },

    context () {
      let prefillEmail = this.getPrefillEmail();
      let prefillPassword = this._formPrefill.get('password');
      let autofocusEl = this._selectAutoFocusEl();

      let relier = this.relier;
      let isSync = relier.isSync();

      let context = {
        serviceName: relier.get('serviceName'),
        isSync: isSync,
        isCustomizeSyncChecked: relier.isCustomizeSyncChecked(),
        isPasswordAutoCompleteDisabled: this.isPasswordAutoCompleteDisabled(),
        email: prefillEmail,
        password: prefillPassword,
        shouldFocusEmail: autofocusEl === 'email',
        shouldFocusPassword: autofocusEl === 'password',
        error: this.error,
        isEmailOptInVisible: this._isEmailOptInEnabled(),
        isMigration: this.isMigration()
      };

      if (isSync && this.isInExperiment('syncCheckbox')) {
        this.notify('syncCheckbox.triggered');
        if (this.isInExperimentGroup('syncCheckbox', 'treatment')) {
          context.isSyncTop = isSync;
          context.isSync = null;
        }
      }


      return context;
    },

    beforeDestroy () {
      let formPrefill = this._formPrefill;
      formPrefill.set('email', this.getElementValue('.email'));
      formPrefill.set('password', this.getElementValue('.password'));
    },

    isValidEnd () {
      if (this._isEmailSameAsBouncedEmail()) {
        return false;
      }

      if (this._isEmailFirefoxDomain()) {
        return false;
      }

      if (! this._coppa.isValid()) {
        return false;
      }

      return FormView.prototype.isValidEnd.call(this);
    },

    showValidationErrorsEnd () {
      if (this._isEmailSameAsBouncedEmail()) {
        this.showValidationError('input[type=email]',
                AuthErrors.toError('DIFFERENT_EMAIL_REQUIRED'));
      } else if (this._isEmailFirefoxDomain()) {
        this.showValidationError('input[type=email]',
                AuthErrors.toError('DIFFERENT_EMAIL_REQUIRED_FIREFOX_DOMAIN'));
      } else {
        this._coppa.showValidationErrors();
      }
    },

    submit () {
      let self = this;
      return p()
        .then(function () {
          if (! self._isUserOldEnough()) {
            self.notify('signup.tooyoung');

            return self._cannotCreateAccount();
          }
          self.notify('signup.submit');

          return self._initAccount();
        });
    },

    onPasswordBlur () {
      var password = this.getElementValue('.password');
      this.checkPasswordStrength(password);
    },

    onEmailBlur () {
      if (this.isInExperiment('mailcheck')) {
        mailcheck(
          this.$el.find('.email'), this.metrics, this.translator, this);
      }
    },

    _isMailcheckEnabled () {
      // only check whether mailcheck is enabled once. Otherwise,
      // an event is added to the able log every time the user
      // blurs the email field, which could be multiple times.
      if (typeof this._isMailcheckEnabledValue === 'undefined') {
        let abData = {
          isMetricsEnabledValue: this.metrics.isCollectionEnabled(),
          uniqueUserId: this.user.get('uniqueUserId'),
          // the window parameter will override any ab testing features
          forceMailcheck: Url.searchParam('mailcheck', this.window.location.search)
        };

        this._isMailcheckEnabledValue =
              this._able.choose('mailcheckEnabled', abData);
      }

      return this._isMailcheckEnabledValue;
    },

    _wasMailcheckUseful () {
      let email = this.$el.find('.email');

      if (email) {
        let emailValue = email.val();
        let mailcheckValue = email.data('mailcheckValue');
        if (emailValue.length > 0 && mailcheckValue === emailValue) {
          this.logScreenEvent('mailcheck-useful');
        }
      }
    },

    suggestEmail () {
      if (this._isMailcheckEnabled()) {
        mailcheck(this.$el.find('.email'), this.metrics, this.translator);
      }
    },

    _isEmailSameAsBouncedEmail () {
      return (this._bouncedEmail &&
             (this.getElementValue('input[type=email]') === this._bouncedEmail));
    },

    _isUserOldEnough () {
      return this._coppa.isUserOldEnough();
    },

    _isEmailFirefoxDomain () {
      let email = this.getElementValue('.email');

      // some users input a "@firefox.com" email.
      // this is not a valid email at this time, therefore we block the attempt.
      if (email.indexOf('@firefox.com') >= 0) {
        return true;
      }

      return false;
    },

    _cannotCreateAccount () {
      // this is a session cookie. It will go away once:
      // 1. the user closes the tab
      // and
      // 2. the user closes the browser
      // Both of these have to happen or else the cookie
      // hangs around like a bad smell.
      document.cookie = 'tooyoung=1;';

      this.navigate('cannot_create_account');
    },

    _initAccount () {
      let self = this;

      let preVerifyToken = self.relier.get('preVerifyToken');
      let account = self.user.initAccount({
        email: self.getElementValue('.email'),
        password: self.getElementValue('.password'),
        customizeSync: self.$('.customize-sync').is(':checked'),
        needsOptedInToMarketingEmail: self.$('.marketing-email-optin').is(':checked')
      });

      if (preVerifyToken) {
        self.logScreenEvent('preverified');
      }

      if (self.relier.isSync()) {
        var customizeSync = account.get('customizeSync');
        self.logScreenEvent('customizeSync.' + String(customizeSync));

        if (customizeSync && self.isInExperiment('syncCheckbox')) {
          self.notify('syncCheckbox.clicked');
        }
      }

      return self.broker.beforeSignIn(account.get('email'))
        .then(function () {
          return self.user.signUpAccount(account, self.relier, {
            resume: self.getStringifiedResumeToken()
          });
        })
        .then(function (account) {
          // formPrefill information is no longer needed after the user
          // has successfully signed up. Clear the info to ensure
          // passwords aren't sticking around in memory.
          self._formPrefill.clear();

          if (preVerifyToken && account.get('verified')) {
            self.logScreenEvent('preverified.success');
          }
          self.logScreenEvent('success');

          if (self.relier.accountNeedsPermissions(account)) {
            self.navigate('signup_permissions', {
              data: {
                account: account
              }
            });

            return;
          }

          return self.onSignUpSuccess(account);
        })
        .fail(_.bind(self.signUpError, self));
    },

    onSignUpSuccess (account) {
      let self = this;
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
    },

    signUpError (err) {
      let self = this;
      // Account already exists. No attempt is made at signing the
      // user in directly, instead, point the user to the signin page
      // where the entered email/password will be prefilled.
      if (AuthErrors.is(err, 'ACCOUNT_ALREADY_EXISTS')) {
        return self._suggestSignIn(err);
      } else if (AuthErrors.is(err, 'USER_CANCELED_LOGIN')) {
        self.logEvent('login.canceled');
        // if user canceled login, just stop
        return;
      }

      // re-throw error, it will be handled at a lower level.
      throw err;
    },

    _suggestSignIn (err) {
      err.forceMessage = t('Account already exists. <a href="/signin">Sign in</a>');
      return this.displayErrorUnsafe(err);
    },

    _isEmailOptInEnabled () {
      return !! this._able.choose('communicationPrefsVisible', {
        lang: this.navigator.language
      });
    }
  });

  Cocktail.mixin(
    View,
    CheckboxMixin,
    ExperimentMixin,
    MigrationMixin,
    PasswordMixin,
    PasswordStrengthMixin,
    ResumeTokenMixin,
    ServiceMixin,
    SignupDisabledMixin
  );

  return View;
});

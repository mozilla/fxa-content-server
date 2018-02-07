/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const AvatarMixin = require('../mixins/avatar-mixin');
  const AuthErrors = require('lib/auth-errors');
  const BaseView = require('../base');
  const Cocktail = require('cocktail');
  const FloatingPlaceholderMixin = require('../mixins/floating-placeholder-mixin');
  const FormView = require('../form');
  const SettingsPanelMixin = require('../mixins/settings-panel-mixin');
  const SearchParamMixin = require('../../lib/search-param-mixin');
  const Template = require('templates/settings/security.mustache');
  const preventDefaultThen = require('../base').preventDefaultThen;
  const showProgressIndicator = require('../decorators/progress_indicator');

  var t = BaseView.t;

  const CODE_INPUT_SELECTOR = 'input.totp-code';
  const CODE_REFRESH_SELECTOR = 'button.settings-button.totp-refresh';
  const CODE_REFRESH_DELAYMS = 350;

  var View = FormView.extend({
    template: Template,
    className: 'security',
    viewName: 'settings.security',

    events: {
      'click .show-code-link': preventDefaultThen('_showCode'),
      'click .totp-cancel': preventDefaultThen('cancel'),
      'click .totp-confirm-code': preventDefaultThen('confirmCode'),
      'click .totp-create': preventDefaultThen('createToken'),
      'click .totp-delete': preventDefaultThen('deleteToken'),
      'click .totp-refresh': preventDefaultThen('refresh'),
    },

    _checkTokenExists() {
      const account = this.getSignedInAccount();
      return account.checkTotpTokenExists()
        .then((result) => {
          this._hasToken = result.exists;
        });
    },

    _santizeCode (code) {
      // Remove spaces and `-`
      return code.replace(/[- ]*/g, '');
    },

    _showQrCode() {
      this.$('#totp').removeClass('hidden');
    },

    _showStatus() {
      this.$('.security-list').removeClass('hidden');
    },

    _hideStatus() {
      this.$('.security-list').addClass('hidden');
    },

    _showCode() {
      $('.manual-code').removeClass('hidden');
      $('.show-code-link').addClass('hidden');
    },

    _getFormattedCode(code) {
      // Insert spaces every 4 characters
      return code.replace(/(\w{4})/g, '$1 ');
    },

    _showSecurityPanel() {
      if (this.getSearchParam('showSecurityPanel')) {
        return true;
      }
      return false;
    },

    beforeRender() {
      // The security panel is currently behind a feature flag. Only show it
      // when the query param `showSecurityPanel` is specified.
      if (! this._showSecurityPanel()) {
        return this.remove();
      } else {
        return this._checkTokenExists();
      }
    },

    initialize() {
      this._hasToken = false;
    },

    setInitialContext(context) {
      context.set({
        hasToken: this._hasToken,
        isPanelOpen: this.isPanelOpen()
      });
    },

    cancel() {
      return this.render()
        .then(() => this.navigate('/settings'));
    },

    createToken() {
      const account = this.getSignedInAccount();
      return account.createTotpToken()
        .then(result => {
          $('.qr-image').attr('src', result.qrCodeUrl);
          $('.code').html(this._getFormattedCode(result.secret));
          this._showQrCode();
          this._hideStatus();
        });
    },

    deleteToken() {
      const account = this.getSignedInAccount();
      return account.deleteTotpToken()
        .then(() => {
          this.displaySuccess(t('Two-step authentication removed'), {
            closePanel: true
          });
          return this.render()
            .then(() => {
              this.navigate('/settings');
            });
        });
    },

    confirmCode() {
      const account = this.getSignedInAccount();
      const code = this._santizeCode(this.getElementValue('input.totp-code'));
      return account.verifyTotpCode(code)
        .then((result) => {
          if (result.success) {
            this.displaySuccess(t('Two-step authentication enabled'), {});
            this.render();
          } else {
            throw AuthErrors.toError('INVALID_TOTP_CODE');
          }
        })
        .catch((err) => this.showValidationError(this.$(CODE_INPUT_SELECTOR), err));

    },

    submit() {
      return this.confirmCode();
    },

    refresh: showProgressIndicator(function () {
      return this.render();
    }, CODE_REFRESH_SELECTOR, CODE_REFRESH_DELAYMS),

  });

  Cocktail.mixin(
    View,
    AvatarMixin,
    SettingsPanelMixin,
    FloatingPlaceholderMixin,
    SearchParamMixin
  );

  module.exports = View;
});

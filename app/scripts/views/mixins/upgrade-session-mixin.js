/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * View mixin to support a user upgrading their session to
 * be verified. This is useful in situations where a panel
 * might contain sensitive information or security related
 * features.
 *
 * This mix-in replaces the template loaded by the view with
 * the upgrade-session template. Once the email has been
 * verified, the page is re-rendered and the user can see
 * the gated panel.
 *
 * @mixin UpgradeSessionMixin
 */

define(function (require, exports, module) {
  'use strict';

  const BaseView = require('../base');
  const { preventDefaultThen } = BaseView;
  const SettingsPanelMixin = require('../mixins/settings-panel-mixin');
  const UpgradeSessionTemplate = require('stache!templates/settings/upgrade_session');
  const t = BaseView.t;

  /**
   * The UpgradeSessionMixin can be configured to display different titles and captions
   * depending on what panel is being gated.
   *
   * @param {Object} [options]
   * *   @param {String} [options.caption] - caption describing what the panel is unlocking
   * *   @param {String} [options.gatedHref] - location that is redirected after session is verified
   * *   @param {String} [options.title] - title name of the panel
   * @returns {Object} UpgradeSessionMixin
   */
  module.exports = (options = {}) => {
    return {
      dependsOn: [SettingsPanelMixin],

      events: {
        'click .refresh-verification-state': preventDefaultThen('_clickRefreshVerificationState'),
        'click .send-verification-email': preventDefaultThen('_clickSendVerificationEmail')
      },

      _clickRefreshVerificationState () {
        this.model.set({
          isPanelOpen: true
        });
        return this.setupSessionGateIfRequired()
          .then((verified) => {
            if (verified) {
              this.displaySuccess(t('Primary email verified successfully'), {
                closePanel: false
              });
            }
            return this.render();
          });
      },

      _clickSendVerificationEmail () {
        const account = this.getSignedInAccount();
        return account.requestVerifySession(this.relier)
          .then(() => {
            this.displaySuccess(t('Verification email sent'), {
              closePanel: false
            });
          });
      },

      setInitialContext (context) {
        context.set({
          caption: this.translate(options.caption),
          email: this.getSignedInAccount().get('email'),
          gatedHref: options.gatedHref,
          isPanelOpen: this.isPanelOpen(),
          title: this.translate(options.title)
        });
      },

      /**
       * Checks to see if the current session is verified. If it is,
       * then it renders the original template, otherwise it renders
       * the upgrade-session template. This template prompts user
       * to verify their email address before they can see the original
       * template.
       *
       * @returns {Boolean} sessionVerified
       */
      setupSessionGateIfRequired () {
        const account = this.getSignedInAccount();
        return account.sessionVerificationStatus()
          .then(({sessionVerified}) => {
            if (! sessionVerified) {
              this.template = UpgradeSessionTemplate;
            } else {
              this.template = options.gatedTemplate;
            }
            return sessionVerified;
          });
      }
    };
  };
});

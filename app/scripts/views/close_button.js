/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * The IFrame'd OAuth flow has a little cancel button.
 * When clicked, this module sends an `oauth_cancel` message
 * to the parent that indicates "close me!"
 */

define([
  'views/base',
  'lib/promise',
  'lib/oauth-errors',
  'stache!templates/partial/close-button'
],
function (BaseView, p, OAuthErrors, CloseTemplate) {
  'use strict';

  return BaseView.extend({
    template: CloseTemplate,

    events: {
      'click': BaseView.preventDefaultThen('close')
    },

    render () {
      return p().then(() => {
        var foxLogo = $('#fox-logo');
        foxLogo.after(this.template());
        this.$el = $('#close');
        this.delegateEvents();
      });
    },

    close () {
      this.logError(OAuthErrors.toError('USER_CANCELED_OAUTH_LOGIN'));
      return this.broker.cancel()
        .fail(this.displayError.bind(this));
    }
  });
});


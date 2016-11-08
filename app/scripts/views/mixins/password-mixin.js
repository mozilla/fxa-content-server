/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// helper functions for views with passwords. Meant to be mixed into views.

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const Constants = require('lib/constants');
  const showPasswordTemplate = require('stache!templates/partial/show-password');

  module.exports = {
    events: {
      'keyup input.password': 'onPasswordKeyUp',
      'mousedown .show-password-label': 'onShowPasswordMouseDown',
      'touchstart .show-password-label': 'onShowPasswordMouseDown'
    },

    initialize () {
      // An internal submitStart event is listened for instead of
      // the `submit` DOM event because form.js already binds a submit
      // event. Because of the way Cocktail wraps colliding functions,
      // the form is always submit if a second event handler is added.
      this.on('submitStart', () => this.hideVisiblePasswords());
    },

    afterRender () {
      if (this._isInShowPasswordExperiment()) {
        this.notifier.trigger('showPassword.triggered');
      }

      this._addShowPasswordLabel(this.$('input[type=password]'));
    },

    /**
     * Add and dhow the "show password" label field if needed, hide it
     * if not needed.
     *
     * @param {String|Element} passwordEls
     */
    _updateShowPasswordLabel (passwordEls) {
      const $targetEl = this.$(passwordEls);
      this._addShowPasswordLabel($targetEl);

      if ($targetEl.val().length === 0) {
        $targetEl.addClass('empty');
      } else {
        $targetEl.removeClass('empty');
      }
    },

    /**
     * If the user is part of the show password control group,
     * add a `show password` label to each of the passed in
     * elements.
     *
     * @param {String|Element} passwordEls
     */
    _addShowPasswordLabel (passwordEls) {
      this.$(passwordEls).each((index, target) => {
        const $passwordEl = this.$(target);
        if (this._shouldCreateShowPasswordLabel($passwordEl)) {
          this._createShowPasswordLabelLabel($passwordEl);
        }
      });
    },

    /**
     * Is the user eligible to see the `show password` label?
     *
     * @returns {Boolean}
     */
    _isEligibleToSeeShowPasswordLabel () {
      return (! this._isInShowPasswordExperiment() ||
                this.isInExperimentGroup('showPassword', 'control'));
    },

    /**
     * Should a show password label be created for the given password field?
     * Only create if eligible and a label does not already exist.
     *
     * @param {Element} $passwordEl
     * @returns {Boolean}
     */
    _shouldCreateShowPasswordLabel ($passwordEl) {
      return this._isEligibleToSeeShowPasswordLabel() &&
            // only add the label if a password has been entered and one
            // has not already been added.
             $passwordEl.val().length &&
             ! this.$(`#show-${$passwordEl.attr('id')}`).length;
    },

    /**
     * Create and add the `show password` label for the given password element
     *
     * @param {Element} $passwordEl
     */
    _createShowPasswordLabelLabel ($passwordEl) {
      const targetId = $passwordEl.attr('id');

      const context = {
        id: `show-${targetId}`,
        synchronizeShow: $passwordEl.data('synchronize-show') || false,
        targetId: targetId
      };

      const showPasswordLabelEl =
        this.renderTemplate(showPasswordTemplate, context);

      $passwordEl.after(showPasswordLabelEl);
    },

    /**
     * Check if the user is in the show password experiment
     *
     * @returns {Boolean}
     */
    _isInShowPasswordExperiment () {
      return this.isInExperiment && this.isInExperiment('showPassword');
    },

    onShowPasswordMouseDown (event) {
      const $buttonEl = this.$(event.target).siblings('.show-password');
      const $passwordEl = this.getAffectedPasswordInputs($buttonEl);

      this.showPassword($passwordEl);

      // hide the password field as soon as the user
      // lets up on the mouse or their finger.
      const hideVisiblePasswords = () => {
        $(this.window).off('mouseup', hideVisiblePasswords);
        $(this.window).off('touchend', hideVisiblePasswords);

        this.hideVisiblePasswords();
      };

      $(this.window).one('mouseup', hideVisiblePasswords);
      $(this.window).one('touchend', hideVisiblePasswords);


      if (this._isInShowPasswordExperiment()) {
        this.notifier.trigger('showPassword.clicked');
      }
    },

    getAffectedPasswordInputs (button) {
      var $passwordEl = this.$(button).siblings('.password');
      if (this.$(button).data('synchronizeShow')) {
        $passwordEl = this.$('.password');
      }
      return $passwordEl;
    },

    /**
     * Make a password field's contents visible.
     *
     * @param {String|Element} passwordEl
     */
    showPassword (passwordEl) {
      const $passwordEl = this.$(passwordEl);
      try {
        $passwordEl.attr('type', 'text').attr('autocomplete', 'off')
          .attr('autocorrect', 'off').attr('autocapitalize', 'off');
      } catch (e) {
        // IE8 blows up when changing the type of the input field. Other
        // browsers might too. Ignore the error.
      }

      const $showPasswordEl = $passwordEl.siblings('.show-password');
      $showPasswordEl.attr('checked', true);

      this.logViewEvent('password.visible');
    },

    /**
     * Hide a password field's contents.
     *
     * @param {String|Element} passwordEl
     */
    hidePassword (passwordEl) {
      const $passwordEl = this.$(passwordEl);
      try {
        $passwordEl.attr('type', 'password').removeAttr('autocomplete')
          .removeAttr('autocorrect').removeAttr('autocapitalize');
      } catch (e) {
        // IE8 blows up when changing the type of the input field. Other
        // browsers might too. Ignore the error.
      }

      const $showPasswordEl = $passwordEl.siblings('.show-password');
      $showPasswordEl.removeAttr('checked');

      this.logViewEvent('password.hidden');
      this.focus($passwordEl);
    },

    /**
     * Hide all visible passwords to prevent passwords from being saved
     * by the browser as text form data.
     */
    hideVisiblePasswords () {
      this.$el.find('.password[type=text]').each((index, el) => {
        this.hidePassword(el);
      });
    },

    onPasswordKeyUp (event) {
      this._updateShowPasswordLabel(event.target);

      var values = [];

      // Values contains all password classes length
      this.$('.password').each(function (index, el) {
        values.push($(el).val().length);
      });

      var val = Math.min.apply(Math, values);

      if (val < Constants.PASSWORD_MIN_LENGTH) {
        this.showPasswordHelper();
      } else {
        this.hidePasswordHelper();
      }
    },

    showPasswordHelper () {
      this.$('.input-help').css('opacity', '1');
    },

    hidePasswordHelper () {
      // Hide all input-help classes except input-help-forgot-pw
      this.$('.input-help:not(.input-help-forgot-pw)').css('opacity', '0');
    }
  };
});

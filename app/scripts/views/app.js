/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * The outermost view of the system. Handles window level interactions.
 *
 * @module views/app
 */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const BaseView = require('views/base');
  const Cocktail = require('cocktail');
  const Environment = require('lib/environment');
  const KeyCodes = require('lib/key-codes');
  const LoadingMixin = require('views/mixins/loading-mixin');
  const p = require('lib/promise');

  var AppView = BaseView.extend({
    initialize (options = {}) {
      this._environment = options.environment || new Environment(this.window);
      this._createView = options.createView;
    },

    events: {
      'click a[href^="/"]': 'onAnchorClick',
      'keyup': 'onKeyUp'
    },

    onKeyUp (event) {
      // Global listener for keyboard events. This is
      // useful for cases where the view has lost focus
      // but you still want to perform an action on that view.

      // Handle user pressing `ESC`
      if (event.which === KeyCodes.ESCAPE) {

        // Pressing ESC when any modal is visible should close the modal.
        if ($.modal.isActive()) {
          $.modal.close();
        } else if (event.currentTarget.className.indexOf('settings') >= 0) {

          // If event came from any settings view, close all panels and
          // goto base settings view.
          $('.settings-unit').removeClass('open');
          this.navigate('settings');
        }
      }
    },

    onAnchorClick (event) {
      // if someone killed this event, or the user is holding a modifier
      // key, ignore the event.
      if (event.isDefaultPrevented() ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey) {
        return;
      }

      event.preventDefault();

      // Remove leading slashes
      var url = $(event.currentTarget).attr('href').replace(/^\//, '');
      if (this._environment.isFramed() && url.indexOf('legal') > -1) {
        this.window.open(url, '_blank');
        return;
      }

      this.navigate(url);
    },

    _currentView: null,

    /**
     * Show a top level view
     *
     * @param {Function} Constructor view constructor
     * @param {Object} [options] options to pass to Constructor
     * @returns {Promise}
     */
    showChildView (Constructor, options = {}) {
      return p().then(() => {
        const currentView = this._currentView;
        if (currentView instanceof Constructor) {
          // child view->parent view
          //
          // No need to re-render, only notify parties of the event.
          // update the current view's model with data sent from
          // the child view.
          currentView.model.set(options.model.toJSON());
          this.notifier.trigger('navigate-from-child-view', options);

          return currentView;
        } else if (currentView) {
          currentView.destroy();
          this._currentView = null;
        }

        const viewToShow = this._createView(Constructor, options);
        return viewToShow.render()
          .then((isShown) => {
            // render will return false if the view could not be
            // rendered for any reason, including if the view was
            // automatically redirected.
            if (! isShown) {
              viewToShow.destroy();
              return null;
            }
            this._currentView = viewToShow;

            this.writeToDOM(viewToShow.el);
            viewToShow.afterVisible();

            this.notifier.trigger('view-shown', viewToShow);

            return viewToShow;
          });
      });
    }
  });

  Cocktail.mixin(
    AppView,
    LoadingMixin
  );

  module.exports = AppView;
});

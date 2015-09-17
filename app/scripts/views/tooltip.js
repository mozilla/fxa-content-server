/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// It's a tooltip!

define([
  'underscore',
  'jquery',
  'views/base'
], function (_, $, BaseView) {
  'use strict';

  let displayedTooltip;
  const PADDING_BELOW_TOOLTIP_PX = 2;
  const PADDING_ABOVE_TOOLTIP_PX = 4;

  let Tooltip = BaseView.extend({
    tagName: 'aside',
    className: 'tooltip',
    // tracks the type of a tooltip, used for metrics purposes
    type: 'generic',

    initialize (options = {}) {
      this.message = options.message || '';
      this.dismissible  = options.dismissible || false;
      this.extraClassNames = options.extraClassNames || '';

      // the tooltip has to be attached to an element.
      // By default, the tooltip is displayed just above the
      // element. If the element has the 'tooltip-below' class, the
      // tooltip is displayed just below it.
      this.invalidEl = $(options.invalidEl);
    },

    template () {
      return this.translator.get(this.message);
    },

    afterRender () {
      // only one tooltip at a time!
      if (displayedTooltip) {
        displayedTooltip.destroy(true);
      }
      displayedTooltip = this;

      let tooltipContainer = this.invalidEl.closest('.input-row,.select-row-wrapper');

      this.$el.addClass(this.extraClassNames);
      this.$el.appendTo(tooltipContainer);

      this.setPosition();

      if (this.dismissible) {
        this.$el.append('<span class="dismiss" tabindex="2">&#10005;</span>');
      }

      this.bindDOMEvents();
    },

    beforeDestroy () {
      displayedTooltip = null;

      // ditch the events we manually added to reduce interference
      // between tooltips.
      let invalidEl = this.invalidEl;
      invalidEl.off('keydown change', this._destroy);
      invalidEl.find('option').off('click', this._destroy);
    },

    setPosition () {
      // by default, the position is above the input/select element
      // to show the tooltip below the element, we use JS to set
      // the top of the tooltip to be just below the element it is
      // attached to.
      let tooltipEl = this.$el;
      let invalidEl = this.invalidEl;
      if (invalidEl.hasClass('tooltip-below')) {
        tooltipEl.addClass('tooltip-below fade-up-tt');
        tooltipEl.css({
          top: invalidEl.outerHeight() + PADDING_ABOVE_TOOLTIP_PX
        });
      } else {
        tooltipEl.css({
          top: -tooltipEl.outerHeight() - PADDING_BELOW_TOOLTIP_PX
        });
        tooltipEl.addClass('fade-down-tt');
      }
    },

    bindDOMEvents () {
      let invalidEl = this.invalidEl;

      // destroy the tooltip any time the user
      // interacts with the invalid element.
      this._destroy = _.bind(this.destroy, this, true);
      // keyboard input for input/select elements.
      invalidEl.one('change', this._destroy);
      // destroy the tooltip if a key different than tab is pressed
      let destroyIfNotTab = (e) => {
        if (e.which !== 9) {
          this._destroy();
        } else {
          // the key is tab: ignore the event and reattach the handler again for
          // future events
          invalidEl.one('keydown', destroyIfNotTab);
        }
      };

      invalidEl.one('keydown', destroyIfNotTab);
      // handle selecting an option with the mouse for select elements
      invalidEl.find('option').one('click', this._destroy);

      // destroy when dismissed
      this.$el.find('.dismiss').one('click keypress', (e) => {
        if (e.type === 'click' || e.which === 13) {
          let metricsEvent = 'tooltip.' + this.type + '-dismissed';
          this.logEvent(metricsEvent);
          this._destroy();
        }
      });
    }
  });

  return Tooltip;
});

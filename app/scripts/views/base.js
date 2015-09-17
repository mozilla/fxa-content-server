/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'cocktail',
  'underscore',
  'backbone',
  'raven',
  'jquery',
  'lib/promise',
  'lib/auth-errors',
  'lib/ephemeral-messages',
  'lib/null-metrics',
  'views/mixins/timer-mixin'
],
function (Cocktail, _, Backbone, Raven, $, p, AuthErrors,
      EphemeralMessages, NullMetrics, TimerMixin) {
  'use strict';

  const DEFAULT_TITLE = window.document.title;
  const EPHEMERAL_MESSAGE_ANIMATION_MS = 150;

  // Share one ephemeral messages across all views. View can be
  // intialized with an ephemeralMessages for testing.
  const ephemeralMessages = new EphemeralMessages();

  // A null metrics instance is created for unit tests. In the app,
  // when a view is initialized, an initialized Metrics instance
  // is passed in to the constructor.
  const nullMetrics = new NullMetrics();

  function displaySuccess(displayStrategy, msg) {
    this.hideError();

    if (msg) {
      this.$('.success')[displayStrategy](this.translator.get(msg));
    }

    this.$('.success').slideDown(EPHEMERAL_MESSAGE_ANIMATION_MS);
    this.trigger('success', msg);
    this._isSuccessVisible = true;
  }

  function displayError(displayStrategy, err) {
    // Errors are disabled on page unload to supress errors
    // caused by aborted XHR requests.
    if (! this._areErrorsEnabled) {
      console.error('Error ignored: %s', JSON.stringify(err));
      return;
    }

    this.hideSuccess();

    err = this._normalizeError(err);

    this.logError(err);
    const translated = this.translateError(err);

    if (translated) {
      this.$('.error')[displayStrategy](translated);
    }

    this.$('.error').slideDown(EPHEMERAL_MESSAGE_ANIMATION_MS);
    this.trigger('error', translated);

    this._isErrorVisible = true;

    return translated;
  }

  /**
   * Return the error module that produced the error, based on the error's
   * namespace.
   */
  function getErrorModule(err) {
    if (err && err.errorModule) {
      return err.errorModule;
    } else {
      return AuthErrors;
    }
  }


  const BaseView = Backbone.View.extend({
    constructor (options = {}) {
      this.subviews = [];
      this.window = options.window || window;
      this.navigator = options.navigator || this.window.navigator || navigator;
      this.translator = options.translator || this.window.translator;
      this.router = options.router || this.window.router;
      this.ephemeralMessages = options.ephemeralMessages || ephemeralMessages;
      this.metrics = options.metrics || nullMetrics;
      this.sentryMetrics = options.sentryMetrics || Raven;
      this.relier = options.relier;
      this.broker = options.broker;
      this.user = options.user;
      this.screenName = options.screenName || '';

      this.fxaClient = options.fxaClient;

      Backbone.View.call(this, options);

      // Prevent errors from being displayed by aborted XHR requests.
      this._boundDisableErrors = _.bind(this.disableErrors, this);
      $(this.window).on('beforeunload', this._boundDisableErrors);
    },

    /**
     * Render the view - Rendering is done asynchronously.
     *
     * Two functions can be overridden to perform data validation:
     * * beforeRender - called before rendering occurs. Can be used
     *   to perform data validation. Return a promise to
     *   perform an asynchronous check. Return false or a promise
     *   that resolves to false to prevent rendering.
     * * afterRender - called after the rendering occurs. Can be used
     *   to print an error message after the view is already rendered.
     */
    render () {
      return p()
        .then(() => {
          return this._checkUserAuthorization();
        })
        .then((isUserAuthorized) => {
          return isUserAuthorized && this.beforeRender();
        })
        .then((shouldRender) => {
          // rendering is opt out.
          if (shouldRender === false) {
            return false;
          }

          return p().then(() => {
            this.destroySubviews();

            // force a re-load of the context every time the
            // view is rendered or else stale data may
            // be returned.
            this._context = null;
            this.$el.html(this.template(this.getContext()));
          })
          .then(_.bind(this.afterRender, this))
          .then(() => {
            this.showEphemeralMessages();

            return true;
          });
        });
    },

    // Checks that the user's current account exists and is
    // verified. Returns either true or false.
    _checkUserAuthorization () {
      return this.isUserAuthorized()
        .then((isUserAuthorized) => {
          if (! isUserAuthorized) {
            // user is not authorized, make them sign in.
            const err = AuthErrors.toError('SESSION_EXPIRED');
            this.navigate(this._reAuthPage(), {
              error: err,
              data: {
                redirectTo: this.router.getCurrentPage()
              }
            });
            return false;
          }

          if (this.mustVerify) {
            return this.isUserVerified()
              .then((isUserVerified) => {
                if (! isUserVerified) {
                  // user is not verified, prompt them to verify.
                  this.navigate('confirm', {
                    data: {
                      account: this.getSignedInAccount()
                    }
                  });
                }

                return isUserVerified;
              });
          }

          return true;
        });
    },

    // If the user navigates to a page that requires auth and their session
    // is not currently cached, we ask them to sign in again. If the relier
    // specifies an email address, we force the user to use that account.
    _reAuthPage () {
      const self = this;
      if (self.relier && self.relier.get('email')) {
        return 'force_auth';
      }
      return 'signin';
    },

    showEphemeralMessages () {
      const success = this.ephemeralMessages.get('success');
      if (success) {
        this.displaySuccess(success);
      }

      const successUnsafe = this.ephemeralMessages.get('successUnsafe');
      if (successUnsafe) {
        this.displaySuccessUnsafe(successUnsafe);
      }

      const error = this.ephemeralMessages.get('error');
      if (error) {
        this.displayError(error);
      }
    },

    ephemeralData () {
      return this.ephemeralMessages.get('data') || {};
    },

    /**
     * Checks if the user is authorized to view the page. Currently
     * the only check is if the user is signed in and the page requires
     * authentication, but this could be extended to other types of
     * authorization as well.
     */
    isUserAuthorized () {
      return p().then(() => {
        if (this.mustAuth || this.mustVerify) {
          const sessionToken = this.getSignedInAccount().get('sessionToken');
          return !! sessionToken && this.fxaClient.isSignedIn(sessionToken);
        }
        return true;
      });
    },

    isUserVerified () {
      const account = this.getSignedInAccount();
      // If the cached account data shows it hasn't been verified,
      // check again and update the data if it has.
      if (! account.get('verified')) {
        return account.isVerified()
          .then((hasVerified) => {
            if (hasVerified) {
              account.set('verified', hasVerified);
              this.user.setAccount(account);
            }
            return hasVerified;
          });
      }

      return p(true);
    },

    titleFromView (title = DEFAULT_TITLE) {
      const titleText = this.$('header:first h1').text();
      const subText = this.$('header:first h2').text();

      if (titleText && subText) {
        title = titleText + ': ' + subText;
      } else if (titleText) {
        title = titleText;
      } else if (subText) {
        title = title + ': ' + subText;
      }

      return title;
    },

    getContext () {
      // use cached context, if available. This prevents the context()
      // function from being called multiple times per render.
      if (! this._context) {
        this._context = this.context() || {};
      }
      const ctx = this._context;

      ctx.t = _.bind(this.translate, this);

      return ctx;
    },

    translate () {
      return (text) => {
        return this.translator.get(text, this.getContext());
      };
    },

    context () {
      // Implement in subclasses
    },

    beforeRender () {
      // Implement in subclasses. If returns false, or if returns a promise
      // that resolves to false, then the view is not rendered.
      // Useful if the view must immediately redirect to another view.
    },

    afterRender () {
      // Implement in subclasses
    },

    // called after the view is visible.
    afterVisible () {
      // make a huge assumption and say if the device does not have touch,
      // it's a desktop device and autofocus can be applied without
      // hiding part of the screen. The no-touch class is added by
      // startup-styles
      if ($('html').hasClass('no-touch')) {
        const autofocusEl = this.$('[autofocus]');
        if (! autofocusEl.length) {
          return;
        }

        const attemptFocus = () => {
          if (autofocusEl.is(':focus')) {
            return;
          }
          this.focus(autofocusEl);

          // only elements that are visible can be focused. When embedded in
          // about:accounts, the content is hidden when the first "focus" is
          // done. Keep trying to focus until the element is actually focused,
          // and then stop trying.
          if (! autofocusEl.is(':visible')) {
            this.setTimeout(attemptFocus, 50);
          }
        };

        attemptFocus();
      }
    },

    destroy (remove) {
      this.trigger('destroy');

      if (this.beforeDestroy) {
        this.beforeDestroy();
      }

      if (remove) {
        this.remove();
      } else {
        this.stopListening();
        this.$el.off();
      }

      this.$(this.window).off('beforeunload', this._boundDisableErrors);

      this.destroySubviews();

      this.trigger('destroyed');
    },

    trackSubview (view) {
      if (! _.contains(this.subviews, view)) {
        this.subviews.push(view);
        view.on('destroyed', _.bind(this.untrackSubview, this, view));
      }

      return view;
    },

    untrackSubview (view) {
      this.subviews = _.without(this.subviews, view);

      return view;
    },

    destroySubviews () {
      _.invoke(this.subviews, 'destroy');

      this.subviews = [];
    },

    isSubviewTracked (view) {
      return _.indexOf(this.subviews, view) > -1;
    },

    /**
     * Display a success message
     * @method displaySuccess
     * If msg is not given, the contents of the .success element's text
     * will not be updated.
     */
    displaySuccess: _.partial(displaySuccess, 'text'),

    /**
     * Display a success message
     * @method displaySuccess
     * If msg is not given, the contents of the .success element's HTML
     * will not be updated.
     */
    displaySuccessUnsafe: _.partial(displaySuccess, 'html'),

    hideSuccess () {
      this.$('.success').slideUp(EPHEMERAL_MESSAGE_ANIMATION_MS);
      this._isSuccessVisible = false;
    },

    /**
     * Return true if the success message is visible
     */
    isSuccessVisible () {
      return !! this._isSuccessVisible;
    },

    /**
     * Display an error message.
     * @method translateError
     * @param {string} err - an error object
     *
     * @return {string} translated error text (if available), untranslated
     *   error text otw.
     */
    translateError (err) {
      const errors = getErrorModule(err);
      const translated = errors.toInterpolatedMessage(err, this.translator);

      return translated;
    },

    _areErrorsEnabled: true,
    /**
     * Disable logging and display of errors.
     *
     * @method disableErrors
     */
    disableErrors () {
      this._areErrorsEnabled = false;
    },

    /**
     * Display an error message.
     * @method displayError
     * @param {string} err - If err is not given, the contents of the
     *   `.error` element's text will not be updated.
     *
     * @return {string} translated error text (if available), untranslated
     *   error text otw.
     */
    displayError: _.partial(displayError, 'text'),

    /**
     * Display an error message that may contain HTML. Marked unsafe
     * because msg could contain XSS. Use with caution and never
     * with unsanitized user generated content.
     *
     * @method displayErrorUnsafe
     * @param {string} err - If err is not given, the contents of the
     *   `.error` element's text will not be updated.
     *
     * @return {string} translated error text (if available), untranslated
     *   error text otw.
     */
    displayErrorUnsafe: _.partial(displayError, 'html'),

    /**
     * Log an error to the event stream
     */
    logError (err) {
      err = this._normalizeError(err);

      // The error could already be logged, if so, abort mission.
      // This can occur when `navigate` redirects a user to a different
      // screen and an error is passed. The error is logged before the screen
      // transition, the new screen is rendered, then the original error is
      // displayed. This avoids duplicate entries.
      if (err.logged) {
        return;
      }
      err.logged = true;

      if (typeof console !== 'undefined' && console) {
        console.error(err.message || err);
      }
      this.sentryMetrics.captureException(err);
      this.metrics.logError(err);
    },

    getScreenName () {
      return this.screenName;
    },

    _normalizeError (err) {
      const errors = getErrorModule(err);
      if (! err) {
        // likely an error in logic, display an unexpected error to the
        // user and show a console trace to help us debug.
        err = errors.toError('UNEXPECTED_ERROR');

        if (this.window.console && this.window.console.trace) {
          this.window.console.trace();
        }
      }

      if (typeof err === 'string') {
        err = new Error(err);
      }

      if (! err.context) {
        err.context = this.getScreenName();
      }

      return err;
    },

    /**
     * Log the current screen
     */
    logScreen () {
      this.metrics.logScreen(this.getScreenName());
    },

    /**
     * Log an event to the event stream
     */
    logEvent (eventName) {
      this.metrics.logEvent(eventName);
    },

    /**
     * Log an event with the screen name as a prefix
     */
    logScreenEvent (eventName) {
      const screenName = this.getScreenName();
      const event = `${screenName}.${eventName}`;

      this.metrics.logEvent(event);
    },

    hideError () {
      this.$('.error').slideUp(EPHEMERAL_MESSAGE_ANIMATION_MS);
      this._isErrorVisible = false;
    },

    isErrorVisible () {
      return !! this._isErrorVisible;
    },

    /**
     * navigate to another screen
     */
    navigate (page, options = {}) {
      if (options.success) {
        this.ephemeralMessages.set('success', options.success);
      }
      if (options.successUnsafe) {
        this.ephemeralMessages.set('successUnsafe', options.successUnsafe);
      }

      if (options.error) {
        // log the error entry before the new screen is rendered so events
        // stay in the correct order.
        this.logError(options.error);
        this.ephemeralMessages.set('error', options.error);
      }

      if (options.data) {
        this.ephemeralMessages.set('data', options.data);
      }

      this.router.navigate(page, { trigger: true });
    },

    /**
     * Safely focus an element
     */
    focus (which) {
      try {
        const focusEl = this.$(which);
        // place the cursor at the end of the input when the
        // element is focused.
        focusEl.one('focus', function () {
          try {
            this.selectionStart = this.selectionEnd = this.value.length;
          } catch (e) {
            // This can blow up on password fields in Chrome. Drop the error on
            // the ground, for whatever reason, it still behaves as we expect.
          }
        });
        focusEl.get(0).focus();
      } catch (e) {
        // IE can blow up if the element is not visible.
      }
    },

    /**
     * Invoke the specified handler with the given event. Handler
     * can either be a function or a string. If a string, looks for
     * the handler on `this`.
     *
     * @method invokeHandler
     * @param {string || function} handler.
     */
    invokeHandler (handler, ...args){
      // convert a name to a function.
      if (_.isString(handler)) {
        handler = this[handler];

        if (! _.isFunction(handler)) {
          throw new Error(handler + ' is an invalid function name');
        }
      }

      if (_.isFunction(handler)) {
        // If an `arguments` type object was passed in as the first item,
        // then use that as the arguments list. Otherwise, use all arguments.
        if (_.isArguments(args[0])) {
          args = args[0];
        }

        return handler.apply(this, args);
      }
    },

    /**
     * Returns the currently logged in account
     */
    getSignedInAccount () {
      return this.user.getSignedInAccount();
    },

    /**
     * Returns the account that is active in the current view. It may not
     * be the currently logged in account.
     */
    getAccount () {
      // Implement in subclasses
    },

    /**
     * Shows the SubView, creating and rendering it if needed.
     */
    showSubView (/* SubView */) {
      // Implement in subclasses
    }
  });

  /**
   * Return a backbone compatible event handler that
   * prevents the default action, then calls the specified handler.
   * @method Baseview.preventDefaultThen
   * handler can be either a string or a function. If a string, this[handler]
   * will be called. Handler called with context of "this" view and is passed
   * the event
   */
  BaseView.preventDefaultThen = function (handler) {
    return function (event) {
      if (event) {
        event.preventDefault();
      }

      const args = [].slice.call(arguments, 0);
      args.unshift(handler);
      return this.invokeHandler.apply(this, args);
    };
  };

  /**
   * Completely cancel an event (preventDefault, stopPropagation), then call
   * the handler
   * @method BaseView.cancelEventThen
   */
  BaseView.cancelEventThen = function (handler) {
    return function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const args = [].slice.call(arguments, 0);
      args.unshift(handler);
      return this.invokeHandler.apply(this, args);
    };
  };

  /**
   * t is a wrapper that is used for string extraction. The extraction
   * script looks for t(...), and the translator will eventually
   * translate it. t is put onto BaseView instead of
   * Translator to reduce the number of dependencies in the views.
   */
  function t(str) {
    return str;
  }

  BaseView.t = t;

  Cocktail.mixin(
    BaseView,
    TimerMixin
  );

  return BaseView;
});

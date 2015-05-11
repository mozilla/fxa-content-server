/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'underscore',
  'jquery',
  'backbone',
  'lib/promise',
  'lib/storage',
  'views/sign_in',
  'views/force_auth',
  'views/sign_up',
  'views/confirm',
  'views/legal',
  'views/tos',
  'views/pp',
  'views/cannot_create_account',
  'views/complete_sign_up',
  'views/reset_password',
  'views/confirm_reset_password',
  'views/complete_reset_password',
  'views/confirm_account_unlock',
  'views/complete_account_unlock',
  'views/ready',
  'views/settings',
  'views/settings/avatar',
  'views/settings/avatar_change',
  'views/settings/avatar_crop',
  'views/settings/avatar_gravatar',
  'views/settings/avatar_camera',
  'views/change_password',
  'views/delete_account',
  'views/cookies_disabled',
  'views/clear_storage',
  'views/unexpected_error',
  'views/permissions'
],
function (
  _,
  $,
  Backbone,
  p,
  Storage,
  SignInView,
  ForceAuthView,
  SignUpView,
  ConfirmView,
  LegalView,
  TosView,
  PpView,
  CannotCreateAccountView,
  CompleteSignUpView,
  ResetPasswordView,
  ConfirmResetPasswordView,
  CompleteResetPasswordView,
  ConfirmAccountUnlockView,
  CompleteAccountUnlockView,
  ReadyView,
  SettingsView,
  AvatarView,
  AvatarChangeView,
  AvatarCropView,
  AvatarGravatarView,
  AvatarCameraView,
  ChangePasswordView,
  DeleteAccountView,
  CookiesDisabledView,
  ClearStorageView,
  UnexpectedErrorView,
  PermissionsView
) {

  function showViewGenerator(View, options) {
    return function () {
      this.createAndShowView(View, options);
    };
  }

  var Router = Backbone.Router.extend({
    routes: {
      '(/)': 'redirectToSignupOrSettings',
      'signin(/)': showViewGenerator(SignInView),
      'signin_permissions(/)': showViewGenerator(PermissionsView, { type: 'sign_in' }),
      'oauth(/)': 'redirectToBestOAuthChoice',
      'oauth/signin(/)': showViewGenerator(SignInView),
      'oauth/signup(/)': showViewGenerator(SignUpView),
      'oauth/force_auth(/)': showViewGenerator(ForceAuthView),
      'signup(/)': showViewGenerator(SignUpView),
      'signup_complete(/)': showViewGenerator(ReadyView, { type: 'sign_up' }),
      'signup_permissions(/)': showViewGenerator(PermissionsView, { type: 'sign_up' }),
      'cannot_create_account(/)': showViewGenerator(CannotCreateAccountView),
      'verify_email(/)': showViewGenerator(CompleteSignUpView),
      'confirm(/)': showViewGenerator(ConfirmView),
      'settings(/)': showViewGenerator(SettingsView),
      'settings/avatar(/)': showViewGenerator(AvatarView),
      'settings/avatar/change(/)': showViewGenerator(AvatarChangeView),
      'settings/avatar/crop(/)': showViewGenerator(AvatarCropView),
      'settings/avatar/gravatar(/)': showViewGenerator(AvatarGravatarView),
      'settings/avatar/camera(/)': showViewGenerator(AvatarCameraView),
      'change_password(/)': showViewGenerator(ChangePasswordView),
      'delete_account(/)': showViewGenerator(DeleteAccountView),
      'legal(/)': showViewGenerator(LegalView),
      'legal/terms(/)': showViewGenerator(TosView),
      'legal/privacy(/)': showViewGenerator(PpView),
      'reset_password(/)': showViewGenerator(ResetPasswordView),
      'confirm_reset_password(/)': showViewGenerator(ConfirmResetPasswordView),
      'complete_reset_password(/)': showViewGenerator(CompleteResetPasswordView),
      'reset_password_complete(/)': showViewGenerator(ReadyView, { type: 'reset_password' }),
      'force_auth(/)': showViewGenerator(ForceAuthView),
      'cookies_disabled(/)': showViewGenerator(CookiesDisabledView),
      'clear(/)': showViewGenerator(ClearStorageView),
      'unexpected_error(/)': showViewGenerator(UnexpectedErrorView),
      'confirm_account_unlock(/)': showViewGenerator(ConfirmAccountUnlockView),
      'complete_unlock_account(/)': showViewGenerator(CompleteAccountUnlockView),
      'account_unlock_complete(/)': showViewGenerator(ReadyView, { type: 'account_unlock' })
    },

    initialize: function (options) {
      options = options || {};

      this.window = options.window || window;

      this.metrics = options.metrics;
      this.language = options.language;
      this.relier = options.relier;
      this.broker = options.broker;
      this.fxaClient = options.fxaClient;
      this.user = options.user;
      this.interTabChannel = options.interTabChannel;
      this.formPrefill = options.formPrefill;
      this.notifications = options.notifications;
      this.able = options.able;

      // back is enabled after the first view is rendered or
      // if the user is re-starts the app.
      this.canGoBack = this.window.sessionStorage.canGoBack || false;

      this._firstViewHasLoaded = false;

      this.watchAnchors();
    },

    navigate: function (url, options) {
      // Only add search parameters if they do not already exist.
      // Search parameters are added to the URLs because they are sometimes
      // used to pass state from the browser to the screens. Perhaps we should
      // take the search parameters on startup, toss them into Session, and
      // forget about this malarky?
      if (! /\?/.test(url)) {
        url = url + this.window.location.search;
      }

      options = options || { trigger: true };
      return Backbone.Router.prototype.navigate.call(this, url, options);
    },

    redirectToSignupOrSettings: function () {
      var url = this.user.getSignedInAccount().get('sessionToken') ?
                  '/settings' : '/signup';
      this.navigate(url, { trigger: true, replace: true });
    },

    /**
     * Redirect the user to the best suitable OAuth flow
     */
    redirectToBestOAuthChoice: function () {
      var account = this.user.getChooserAccount();
      var route = '/oauth/signin';

      if (account.isDefault()) {
        route = '/oauth/signup';
      }

      return this.navigate(route, { trigger: true, replace: true });
    },

    createAndShowView: function (View, options) {
      var self = this;
      return p().then(function () {
        var view = self.createView(View, options);
        return self.showView(view);
      });
    },

    createView: function (View, options) {
      // passed in options block can override
      // default options.
      var viewOptions = _.extend({
        broker: this.broker,
        canGoBack: this.canGoBack,
        fxaClient: this.fxaClient,
        interTabChannel: this.interTabChannel,
        language: this.language,
        metrics: this.metrics,
        profileClient: this.profileClient,
        relier: this.relier,
        router: this,
        user: this.user,
        window: this.window,
        screenName: this.fragmentToScreenName(Backbone.history.fragment),
        formPrefill: this.formPrefill,
        notifications: this.notifications,
        able: this.able
      }, options || {});

      return new View(viewOptions);
    },

    _checkForRefresh: function () {
      var storage = Storage.factory('sessionStorage', this._window);
      var refreshMetrics = storage.get('last_page_loaded');
      var currentView = this.currentView;
      var screenName = currentView.getScreenName();

      if (refreshMetrics && refreshMetrics.view === screenName && this.metrics) {
        currentView.logScreenEvent('refresh');
      }

      refreshMetrics = {
        view: screenName,
        timestamp: Date.now()
      };

      storage.set('last_page_loaded', refreshMetrics);
    },

    showView: function (viewToShow) {
      if (this.currentView) {
        this.currentView.destroy();
      }

      this.currentView = viewToShow;

      // render will return false if the view could not be
      // rendered for any reason, including if the view was
      // automatically redirected.
      var self = this;
      return viewToShow.render()
        .then(function (isShown) {
          if (! isShown) {
            return;
          }

          // Render the new view while stage is invisible then fade it in using css animations
          // catch problems with an explicit opacity rule after class is added.
          $('#stage').html(viewToShow.el).addClass('fade-in-forward').css('opacity', 1);
          viewToShow.afterVisible();

          viewToShow.logScreen();

          // The user may be scrolled part way down the page
          // on screen transition. Force them to the top of the page.
          self.window.scrollTo(0, 0);

          $('#fox-logo').addClass('fade-in-forward').css('opacity', 1);

          // if the first view errors, the fail branch of the promise will be
          // followed. The view will navigate to `unexpected_error`, which will
          // eventually find its way here. `_firstViewHasLoaded` will still be
          // false, so broker.afterLoaded will be called. See
          // https://github.com/mozilla/fxa-content-server/pull/2147#issuecomment-76155999
          if (! self._firstViewHasLoaded) {
            // afterLoaded lets the RP know when the first screen has been
            // loaded. It does not expect a response, so no error handler
            // is attached and the promise is not returned.
            self.broker.afterLoaded();

            // back is enabled after the first view is rendered or
            // if the user is re-starts the app.
            self.canGoBack = self.window.sessionStorage.canGoBack = true;
            self._firstViewHasLoaded = true;
          }
          self._checkForRefresh();
        })
        .fail(function (err) {
          // The router's navigate method doesn't set ephemeral messages,
          // so use the view's higher level navigate method.
          return viewToShow.navigate('unexpected_error', {
            error: err
          });
        });
    },

    _showViewGenerator: showViewGenerator,

    watchAnchors: function () {
      $(document).on('click', 'a[href^="/"]', this.onAnchorClick.bind(this));
    },

    onAnchorClick: function (event) {
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

      // Instruct Backbone to trigger routing events
      this.navigate(url);
    },

    fragmentToScreenName: function (fragment) {
      fragment = fragment || '';
                // strip leading /
      return fragment.replace(/^\//, '')
                // strip trailing /
                .replace(/\/$/, '')
                // any other slashes get converted to '.'
                .replace(/\//g, '.')
                // search params can contain sensitive info
                .replace(/\?.*/, '')
                // replace _ with -
                .replace(/_/g, '-');
    }
  });

  return Router;
});

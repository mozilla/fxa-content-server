/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'jquery',
  'modal',
  'cocktail',
  'lib/promise',
  'lib/session',
  'views/base',
  'views/mixins/avatar-mixin',
  'views/settings/avatar',
  'views/settings/avatar_change',
  'views/settings/avatar_crop',
  'views/settings/avatar_camera',
  'views/settings/avatar_gravatar',
  'views/settings/gravatar_permissions',
  'views/settings/communication_preferences',
  'views/settings/change_password',
  'views/settings/delete_account',
  'views/settings/display_name',
  'views/mixins/settings-mixin',
  'views/decorators/allow_only_one_submit',
  'stache!templates/settings'
],
function ($, modal, Cocktail, p, Session, BaseView, AvatarMixin,
  AvatarView, AvatarChangeView, AvatarCropView, AvatarCameraView, GravatarView,
  GravatarPermissionsView, CommunicationPreferencesView, ChangePasswordView,
  DeleteAccountView, DisplayNameView, SettingsMixin, allowOnlyOneSubmit,
  Template) {
  'use strict';

  var t = BaseView.t;

  var PANEL_VIEWS = [
    AvatarView,
    DisplayNameView,
    CommunicationPreferencesView,
    ChangePasswordView,
    DeleteAccountView,
    AvatarChangeView,
    AvatarCropView,
    AvatarCameraView,
    GravatarView,
    GravatarPermissionsView
  ];

  function renderView(view) {
    return view.render()
      .then(function (shown) {
        if (! shown) {
          view.destroy(true);
          return;
        }
        view.afterVisible();

        return view;
      });
  }

  var View = BaseView.extend({
    template: Template,
    className: 'settings',

    FADE_OUT_SETTINGS: 250,

    initialize: function (options) {
      options = options || {};

      this._able = options.able;
      this._subViewToShow = options.subView;
      this._notifications = options.notifications;
      this._panelViews = options.panelViews || PANEL_VIEWS;

      this.on('navigate-from-subview', this._onNavigateFromSubview.bind(this));

      if (this._notifications) {
        this._notifications.on(this._notifications.EVENTS.PROFILE_CHANGE,
          this._onProfileChange.bind(this));
      }
    },

    context: function () {
      var account = this.getSignedInAccount();

      return {
        username: account.get('email'),
        showSignOut: ! account.isFromSync(),
        communicationPrefsVisible: this._areCommunicationPrefsVisible()
      };
    },

    events: {
      'click #signout': BaseView.preventDefaultThen('signOut')
    },

    _onProfileChange: function () {
      this._showAvatar();
    },

    // When we navigate to settings from a subview
    // close the modal, show any ephemeral messages passed to `navigate`
    _onNavigateFromSubview: function () {
      if ($.modal.isActive()) {
        $.modal.close();
      }
      this.showEphemeralMessages();
      this.logScreen();
    },

    showSubView: function (SubView, options) {
      var self = this;
      if (self._panelViews.indexOf(SubView) === -1) {
        return;
      }

      // Destroy any previous modal view
      if (self._currentSubView && self._currentSubView.isModal) {
        self._currentSubView.closePanel();
      }

      return self._createSubViewIfNeeded(SubView, options)
        .then(function (subView) {
          if (subView) {
            self._currentSubView = subView;
            subView.openPanel();
            subView.logScreen();
            return subView;
          }
        });
    },

    _subviewInstanceFromClass: function (SubView) {
      return this.subviews.filter(function (subView) {
        if (subView instanceof SubView) {
          return true;
        }
      })[0];
    },

    _isModalViewClass: function (SubView) {
      return !! SubView.prototype.isModal;
    },

    _subViewClass: function (SubView) {
      return SubView.prototype.className;
    },

    // Render subview if an instance doesn't already exist
    _createSubViewIfNeeded: function (SubView) {
      var subView = this._subviewInstanceFromClass(SubView);
      if (subView) {
        return p(subView);
      }

      var self = this;
      var className = self._subViewClass(SubView);
      var selector = '.' + className;

      self.$('#subviews').append('<div class="settings-subview ' + className + '"></div>');

      var view = self.router.createView(SubView, {
        el: self.$(selector),
        superView: self
      });

      self.trackSubview(view);

      return renderView(view);
    },

    beforeRender: function () {
      var self = this;
      if (self.relier.get('setting') === 'avatar') {
        self.relier.set('setting', null);
        self.navigate('/settings/avatar/change');
      }

      $('body').addClass('settings');
      var account = self.getSignedInAccount();

      return account.fetchProfile()
        .then(function () {
          self.user.setAccount(account);
        });
    },

    afterRender: function () {
      var self = this;
      var areCommunicationPrefsVisible = self._areCommunicationPrefsVisible();

      // Initial subviews to render; excludes CommunicationPreferencesView if not visible
      // and modal views.
      var initialSubViews = self._panelViews.filter(function (SubView) {
        return (SubView !== CommunicationPreferencesView || areCommunicationPrefsVisible) &&
              ! self._isModalViewClass(SubView);
      });

      self.logScreenEvent('communication-prefs-link.visible.' +
          String(areCommunicationPrefsVisible));

      return p.all(initialSubViews.map(function (SubView) {
        return self._createSubViewIfNeeded(SubView);
      }));
    },

    afterVisible: function () {
      var self = this;
      BaseView.prototype.afterVisible.call(self);

      if (self._subViewToShow) {
        self.showSubView(self._subViewToShow);
      }

      return self._showAvatar();
    },

    beforeDestroy: function () {
      $('.settings').fadeOut(this.FADE_OUT_SETTINGS, function (){
        $('body').removeClass('settings').show();
      });
    },

    _isAvatarLinkVisible: function (account) {
      var email = account.get('email');
      // For automated testing accounts, emails begin with "avatarAB-" and end with "restmail.net"
      var isTestAccount = /^avatarAB-.+@restmail\.net$/.test(email);

      return isTestAccount ||
             this.hasDisplayedAccountProfileImage() ||
             account.get('hadProfileImageSetBefore') ||
             this._able.choose('avatarLinkVisible', { email: email });
    },

    _setupAvatarChangeLinks: function (show) {
      if (show) {
        this.$('.avatar-wrapper > *').wrap('<a href="/settings/avatar/change" class="change-avatar"></a>');
      }
    },

    _showAvatar: function () {
      var self = this;
      var account = self.getSignedInAccount();
      return self.displayAccountProfileImage(account)
        .then(function () {
          self._setupAvatarChangeLinks(self._isAvatarLinkVisible(account));
        });
    },

    _areCommunicationPrefsVisible: function () {
      return !! this._able.choose('communicationPrefsVisible', {
        lang: this.navigator.language
      });
    },

    signOut: allowOnlyOneSubmit(function () {
      var self = this;
      var sessionToken = self.getSignedInAccount().get('sessionToken');

      self.logScreenEvent('signout.submit');
      return self.fxaClient.signOut(sessionToken)
        .fail(function () {
          // ignore the error.
          // Clear the session, even on failure. Everything is A-OK.
          // See issue #616
          self.logScreenEvent('signout.error');
        })
        .fin(function () {
          self.logScreenEvent('signout.success');
          self.user.clearSignedInAccount();
          Session.clear();
          self.navigate('signin', {
            success: t('Signed out successfully')
          });
        });
    }),

    SUCCESS_MESSAGE_DELAY: 3000, // show success message for 3 seconds

    displaySuccess: function () {
      var self = this;
      clearTimeout(self._successTimeout);
      self._successTimeout = setTimeout(function () {
        self.hideSuccess();
      }, self.SUCCESS_MESSAGE_DELAY);
      return BaseView.prototype.displaySuccess.apply(this, arguments);
    },

    displaySuccessUnsafe: function () {
      var self = this;
      clearTimeout(self._successTimeout);
      self._successTimeout = setTimeout(function () {
        self.hideSuccess();
      }, self.SUCCESS_MESSAGE_DELAY);
      return BaseView.prototype.displaySuccessUnsafe.apply(this, arguments);
    }

  });

  Cocktail.mixin(View, AvatarMixin, SettingsMixin);

  return View;
});

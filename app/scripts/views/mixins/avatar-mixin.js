/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// helper functions for views with a profile image. Meant to be mixed into views.

define(function (require, exports, module) {
  'use strict';

  var _ = require('underscore');
  var p = require('lib/promise');
  var AuthErrors = require('lib/auth-errors');
  var Notifier = require('lib/channels/notifier');
  var ProfileErrors = require('lib/profile-errors');
  var ProfileImage = require('models/profile-image');

  var MAX_SPINNER_COMPLETE_TIME = 800; // ms

  var Mixin = {
    notifications: {
      // populated below using event name aliases
    },

    onProfileUpdate: function (/* data */) {
      // implement in view
    },

    displayAccountProfileImage: function (account, wrapperClass, showSpinner) {
      var self = this;
      if (! wrapperClass) {
        wrapperClass = '.avatar-wrapper';
      }

      // We'll optimize the UI for the case that the account
      // doesn't have a profile image if it's not cached
      if (self._shouldShowDefaultProfileImage(account)) {
        self.$(wrapperClass).addClass('with-default');
      }
      else if (showSpinner) {
        self._addLoadingSpinner(self.$(wrapperClass).addClass('with-spinner'));
      }

      return account.fetchCurrentProfileImage()
        .then(function (profileImage) {

          // Cache the result to make sure we don't flash the default
          // image while fetching the latest profile image
          self._updateCachedProfileImage(profileImage, account);
          return profileImage;
        }, function (err) {
          if (! ProfileErrors.is(err, 'UNAUTHORIZED') &&
              ! AuthErrors.is(err, 'UNVERIFIED_ACCOUNT')) {
            self.logError(err);
          }
          // Ignore errors; the image will be rendered as a
          // default image if displayed
          return new ProfileImage();
        })
        .then(function (profileImage) {
          if (showSpinner) {
            // Wait for an upper limit of MAX_SPINNER_COMPLETE_TIME before
            // showing the profile image.  May only be necessary to satisfy
            // tests.
            return p.allSettled([
              self._completeLoadingSpinner(self.$(wrapperClass))
                .timeout(MAX_SPINNER_COMPLETE_TIME)])
              .then(function() { return profileImage; });
          }
          else {
            return p(profileImage);
          }
        })
        .then(function (profileImage) {
          self._displayedProfileImage = profileImage;

          if (profileImage.isDefault()) {
            self.$(wrapperClass)
              .addClass('with-default')
              .append('<span></span>');
            self.logViewEvent('profile_image_not_shown');
          } else {
            self.$(wrapperClass)
              .removeClass('with-default')
              .append( $(profileImage.get('img')).addClass('profile-image') );
            self.logViewEvent('profile_image_shown');
          }
        });
    },

    hasDisplayedAccountProfileImage: function () {
      return this._displayedProfileImage && ! this._displayedProfileImage.isDefault();
    },

    // Makes sure the account has an up-to-date image cache.
    // This should be called after fetching the current profile image.
    _updateCachedProfileImage: function (profileImage, account) {
      if (! account.isDefault()) {
        account.setProfileImage(profileImage);
        this.user.setAccount(account);
      }
    },

    _shouldShowDefaultProfileImage: function (account) {
      return ! account.has('profileImageUrl');
    },

    _addLoadingSpinner: function ($wrapperClass) {
      $wrapperClass.append('<span class="avatar-spinner"></span>');
    },

    // "Completes" the spinner, transitioning the semi-circle to a circle, and
    // then removes the spinner element.
    _completeLoadingSpinner: function ($wrapperClass) {
      var deferred = p.defer();
      var $spinner = $wrapperClass.find('.avatar-spinner');
      $spinner.addClass('completed')
        .on('transitionend', function (evt) {
          // Hook on the transition event of the ::after pseudoelement, which
          // which "expands" to hide the spinner.
          if (evt.originalEvent.pseudoElement === '::after') {
            $spinner.remove();
          }
          else {
            deferred.resolve();
          }
        });
      return deferred.promise;
    },

    logAccountImageChange: function (account) {
      // if the user already has an image set, then report a change event
      if (account.get('hadProfileImageSetBefore')) {
        this.logViewEvent('submit.change');
      } else {
        this.logViewEvent('submit.new');
      }
    },

    updateProfileImage: function (profileImage, account) {
      var self = this;
      account.setProfileImage(profileImage);
      return self.user.setAccount(account)
        .then(_.bind(self._notifyProfileUpdate, self, account.get('uid')));
    },

    deleteDisplayedAccountProfileImage: function (account) {
      var self = this;
      return account.deleteAvatar(self._displayedProfileImage.get('id'))
        .then(function () {
          // A blank image will clear the cache
          self.updateProfileImage(new ProfileImage(), account);
        });
    },

    updateDisplayName: function (displayName) {
      var self = this;
      var account = self.getSignedInAccount();
      account.set('displayName', displayName);
      return self.user.setAccount(account)
        .then(_.bind(self._notifyProfileUpdate, self, account.get('uid')));
    },

    _notifyProfileUpdate: function (uid) {
      this.notifier.triggerAll(Notifier.PROFILE_CHANGE, {
        uid: uid
      });
    }
  };

  Mixin.notifications[Notifier.PROFILE_CHANGE] = 'onProfileUpdate';

  module.exports = Mixin;
});

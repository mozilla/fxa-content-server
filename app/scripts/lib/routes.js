/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Provide a list of pathname->route definitions.
 *
 * To access a route definition, call `module.get(pathname)`.
 * Route definition will contain:
 *   Constructor - constructor of view to display
 *   options - options to pass to Constructor
 *   parentRoute - pathname of the parent route, if needed.
 *
 * @module lib/routes
 */

define((require, exports, module) => {
  'use strict';

  const AvatarCameraView = require('views/settings/avatar_camera');
  const AvatarChangeView = require('views/settings/avatar_change');
  const AvatarCropView = require('views/settings/avatar_crop');
  const AvatarGravatarView = require('views/settings/avatar_gravatar');
  const ConnectAnotherDeviceView = require('views/connect_another_device');
  const CannotCreateAccountView = require('views/cannot_create_account');
  const VerificationReasons = require('lib/verification-reasons');
  const ChangePasswordView = require('views/settings/change_password');
  const ChooseWhatToSyncView = require('views/choose_what_to_sync');
  const ClearStorageView = require('views/clear_storage');
  const CommunicationPreferencesView = require('views/settings/communication_preferences');
  const CompleteResetPasswordView = require('views/complete_reset_password');
  const CompleteSignUpView = require('views/complete_sign_up');
  const ConfirmResetPasswordView = require('views/confirm_reset_password');
  const ConfirmView = require('views/confirm');
  const CookiesDisabledView = require('views/cookies_disabled');
  const DeleteAccountView = require('views/settings/delete_account');
  const ClientsView = require('views/settings/clients');
  const ClientDisconnectView = require('views/settings/client_disconnect');
  const DisplayNameView = require('views/settings/display_name');
  const ForceAuthView = require('views/force_auth');
  const GravatarPermissionsView = require('views/settings/gravatar_permissions');
  const IndexView = require('views/index');
  const LegalView = require('views/legal');
  const OAuthIndexView = require('views/oauth_index');
  const PermissionsView = require('views/permissions');
  const PpView = require('views/pp');
  const ReadyView = require('views/ready');
  const ReportSignInView = require('views/report_sign_in');
  const ResetPasswordView = require('views/reset_password');
  const SettingsView = require('views/settings');
  const SignInView = require('views/sign_in');
  const SignInReportedView = require('views/sign_in_reported');
  const SignInUnblockView = require('views/sign_in_unblock');
  const SignUpView = require('views/sign_up');
  const SmsSendView = require('../views/sms_send');
  const SmsSentView = require('../views/sms_sent');
  const TosView = require('views/tos');
  const WhyConnectAnotherDeviceView = require('views/why_connect_another_device');

  function route(Constructor, options = {}) {
    return {
      Constructor,
      options
    };
  }

  function childRoute(Constructor, parentRoute, options = {}) {
    return {
      Constructor,
      options,
      parentRoute
    };
  }

  // The key of each Route definition is the route the view
  // is accessible at.
  const ROUTES = {
    '': route(IndexView),
    'cannot_create_account': route(CannotCreateAccountView),
    'choose_what_to_sync': route(ChooseWhatToSyncView),
    'clear': route(ClearStorageView),
    'complete_reset_password': route(CompleteResetPasswordView),
    'complete_signin': route(CompleteSignUpView, { type: VerificationReasons.SIGN_IN }),
    'confirm': route(ConfirmView, { type: VerificationReasons.SIGN_UP }),
    'confirm_reset_password': route(ConfirmResetPasswordView),
    'confirm_signin': route(ConfirmView, { type: VerificationReasons.SIGN_IN }),
    'connect_another_device': route(ConnectAnotherDeviceView),
    'connect_another_device/why': childRoute(WhyConnectAnotherDeviceView, 'connect_another_device'),
    'cookies_disabled': route(CookiesDisabledView),
    'force_auth': route(ForceAuthView),
    'legal': route(LegalView),
    'legal/privacy': route(PpView),
    'legal/terms': route(TosView),
    'oauth': route(OAuthIndexView),
    'oauth/force_auth': route(ForceAuthView),
    'oauth/signin': route(SignInView),
    'oauth/signup': route(SignUpView),
    'report_signin': route(ReportSignInView),
    'reset_password': route(ResetPasswordView),
    'reset_password_confirmed': route(ReadyView, { type: VerificationReasons.PASSWORD_RESET }),
    'reset_password_verified': route(ReadyView, { type: VerificationReasons.PASSWORD_RESET }),
    'settings': route(SettingsView),
    'settings/avatar/camera': childRoute(AvatarCameraView, 'settings'),
    'settings/avatar/change': childRoute(AvatarChangeView, 'settings'),
    'settings/avatar/crop': childRoute(AvatarCropView, 'settings'),
    'settings/avatar/gravatar': childRoute(AvatarGravatarView, 'settings'),
    'settings/avatar/gravatar_permissions': childRoute(GravatarPermissionsView, 'settings'),
    'settings/change_password': childRoute(ChangePasswordView, 'settings'),
    'settings/clients': childRoute(ClientsView, 'settings'),
    'settings/clients/disconnect': childRoute(ClientDisconnectView, 'settings'),
    'settings/communication_preferences': childRoute(CommunicationPreferencesView, 'settings'),
    'settings/delete_account': childRoute(DeleteAccountView, 'settings'),
    'settings/display_name': childRoute(DisplayNameView, 'settings'),
    'signin': route(SignInView),
    'signin_confirmed': route(ReadyView, { type: VerificationReasons.SIGN_IN }),
    'signin_permissions': route(PermissionsView, { type: VerificationReasons.SIGN_IN }),
    'signin_reported': route(SignInReportedView),
    'signin_unblock': route(SignInUnblockView),
    'signin_verified': route(ReadyView, { type: VerificationReasons.SIGN_IN }),
    'signup': route(SignUpView),
    'signup_confirmed': route(ReadyView, { type: VerificationReasons.SIGN_UP }),
    'signup_permissions': route(PermissionsView, { type: VerificationReasons.SIGN_UP }),
    'signup_verified': route(ReadyView, { type: VerificationReasons.SIGN_UP }),
    'sms': route(SmsSendView),
    'sms/sent': route(SmsSentView),
    'sms/why': childRoute(WhyConnectAnotherDeviceView, 'sms'),
    'verify_email': route(CompleteSignUpView, { type: VerificationReasons.SIGN_UP })
  };

  module.exports = {
    /**
     * Get a Route definition for `pathname`
     *
     * @param {String} pathname url pathname of route
     * @return {Object} Route definition for route
     */
    get (pathname) {
      return ROUTES[pathname];
    },

    ROUTES: ROUTES
  };
});

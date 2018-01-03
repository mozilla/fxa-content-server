const intern = require('intern').default;
const args = require('yargs').argv;

//const firefoxProfile = require('./tools/firefox_profile');

const fxaAuthRoot = args.fxaAuthRoot || 'http://127.0.0.1:9000/v1';
const fxaContentRoot = args.fxaContentRoot || 'http://127.0.0.1:3030/';
const fxaOAuthRoot = args.fxaOAuthRoot || 'http://127.0.0.1:9010';
const fxaProfileRoot = args.fxaProfileRoot || 'http://127.0.0.1:1111';
const fxaTokenRoot = args.fxaTokenRoot || 'http://127.0.0.1:5000/token';
const fxaEmailRoot = args.fxaEmailRoot || 'http://127.0.0.1:9001';
const fxaOauthApp = args.fxaOauthApp || 'http://127.0.0.1:8080/';
const fxaUntrustedOauthApp = args.fxaUntrustedOauthApp || 'http://127.0.0.1:10139/';

// "fxaProduction" is a little overloaded in how it is used in the tests.
// Sometimes it means real "stage" or real production configuration, but
// sometimes it also means fxa-dev style boxes like "latest". Configuration
// parameter "fxaDevBox" can be used as a crude way to distinguish between
// two.
const fxaProduction = !!args.fxaProduction;
const fxaDevBox = !!args.fxaDevBox;

const fxaToken = args.fxaToken || 'http://';
const asyncTimeout = parseInt(args.asyncTimeout || 5000, 10);

// On Circle, we bail after the first failure.
// args.bailAfterFirstFailure comes in as a string.
const bailAfterFirstFailure = args.bailAfterFirstFailure === 'true';

const config = {
  functionalSuites: [
    'tests/functional/mailcheck.js',
    'tests/functional/sync_v3_email_first.js',
    'tests/functional/fx_firstrun_v2_email_first.js',
    //new and flaky tests above here',
    'tests/functional/sign_in.js',
    'tests/functional/sign_in_cached.js',
    'tests/functional/sign_in_blocked.js',
    'tests/functional/sync_sign_in.js',
    'tests/functional/sync_force_auth.js',
    'tests/functional/sign_up.js',
    'tests/functional/complete_sign_in.js',
    'tests/functional/complete_sign_up.js',
    'tests/functional/connect_another_device.js',
    'tests/functional/send_sms.js',
    'tests/functional/sync_sign_up.js',
    'tests/functional/sync_v2_sign_up.js',
    'tests/functional/sync_v2_sign_in.js',
    'tests/functional/sync_v2_reset_password.js',
    'tests/functional/sync_v2_settings.js',
    'tests/functional/sync_v2_force_auth.js',
    'tests/functional/sync_v3_email_first.js',
    'tests/functional/sync_v3_force_auth.js',
    'tests/functional/sync_v3_reset_password.js',
    'tests/functional/sync_v3_settings.js',
    'tests/functional/sync_v3_sign_in.js',
    'tests/functional/sync_v3_sign_up.js',
    'tests/functional/fx_desktop_handshake.js',
    'tests/functional/fx_firstrun_v1_sign_up.js',
    'tests/functional/fx_firstrun_v1_sign_in.js',
    'tests/functional/fx_firstrun_v1_settings.js',
    'tests/functional/fx_firstrun_v2_email_first.js',
    'tests/functional/fx_firstrun_v2_sign_up.js',
    'tests/functional/fx_firstrun_v2_settings.js',
    'tests/functional/fx_ios_v1_sign_in.js',
    'tests/functional/fx_ios_v1_sign_up.js',
    'tests/functional/fx_fennec_v1_sign_in.js',
    'tests/functional/fx_fennec_v1_force_auth.js',
    'tests/functional/fx_fennec_v1_sign_up.js',
    'tests/functional/fx_fennec_v1_settings.js',
    'tests/functional/mob_android_v1.js',
    'tests/functional/mob_ios_v1.js',
    'tests/functional/bounced_email.js',
    'tests/functional/legal.js',
    'tests/functional/tos.js',
    'tests/functional/pp.js',
    'tests/functional/confirm.js',
    'tests/functional/delete_account.js',
    'tests/functional/reset_password.js',
    'tests/functional/sync_reset_password.js',
    'tests/functional/robots_txt.js',
    'tests/functional/settings.js',
    'tests/functional/settings_clients.js',
    'tests/functional/settings_common.js',
    'tests/functional/settings_change_email.js',
    'tests/functional/settings_secondary_emails.js',
    'tests/functional/sync_settings.js',
    'tests/functional/change_password.js',
    'tests/functional/force_auth.js',
    'tests/functional/force_auth_blocked.js',
    'tests/functional/404.js',
    'tests/functional/500.js',
    'tests/functional/pages.js',
    'tests/functional/back_button_after_start.js',
    'tests/functional/cookies_disabled.js',
    'tests/functional/fonts.js',
    'tests/functional/password_visibility.js',
    'tests/functional/avatar.js',
    'tests/functional/alternative_styles.js',
    'tests/functional/email_opt_in.js',
    'tests/functional/refreshes_metrics.js',
    'tests/functional/upgrade_storage_formats.js',
  ],
  environments: {
    browserName: 'firefox',
    fixSessionCapabilities: 'no-detect'
  },
  reporters: 'runner',
  tunnelOptions: {
    'drivers': ['firefox']
  },
  bail: bailAfterFirstFailure,

  // custom config
  fxaAuthRoot: fxaAuthRoot,
  fxaContentRoot: fxaContentRoot,
  fxaDevBox: fxaDevBox,
  fxaEmailRoot: fxaEmailRoot,
  fxaOAuthRoot: fxaOAuthRoot,
  fxaOauthApp: fxaOauthApp,
  fxaProduction: fxaProduction,
  fxaProfileRoot: fxaProfileRoot,
  fxaToken: fxaToken,
  fxaTokenRoot: fxaTokenRoot,
  fxaUntrustedOauthApp: fxaUntrustedOauthApp,
};

if (args.grep) {
  config.grep = new RegExp(args.grep, 'i');
}

//config.capabilities['moz:firefoxOptions'] = {};
// to create a profile, give it the `config` option.
//config.capabilities['moz:firefoxOptions'].profile = firefoxProfile(config); //eslint-disable-line camelcase


intern.configure(config);
intern.run();

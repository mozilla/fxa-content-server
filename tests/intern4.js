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
const fxaProduction = !! args.fxaProduction;
const fxaDevBox = !! args.fxaDevBox;

const fxaToken = args.fxaToken || 'http://';
const asyncTimeout = parseInt(args.asyncTimeout || 5000, 10);

// On Circle, we bail after the first failure.
// args.bailAfterFirstFailure comes in as a string.
const bailAfterFirstFailure = args.bailAfterFirstFailure === 'true';

const config = {
  functionalSuites: ['tests/functional/404.js'],
  environments: { browserName: 'firefox' },
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



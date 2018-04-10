/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* eslint-disable camelcase */

'use strict';

const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const path = require('path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const pkg = require('../../package.json');
const amplitude = proxyquire(path.resolve('server/lib/amplitude'), {
  './configuration': {
    get () {
      return {
        '0': 'amo',
        '1': 'pocket'
      };
    }
  }
});
const APP_VERSION = /^[0-9]+\.([0-9]+)\./.exec(pkg.version)[1];

registerSuite('amplitude', {
  beforeEach () {
    sinon.stub(process.stderr, 'write').callsFake(() => {});
  },

  afterEach () {
    process.stderr.write.restore();
  },

  tests: {
    /*eslint-disable sorting/sort-object-props */
    'app version seems sane': () => {
      assert.typeOf(APP_VERSION, 'string');
      assert.match(APP_VERSION, /^[0-9]+$/);
    },

    'interface is correct': () => {
      assert.isFunction(amplitude);
      assert.lengthOf(amplitude, 2);
    },

    'does not throw if arguments are missing': () => {
      assert.doesNotThrow(amplitude);
      assert.doesNotThrow(() => amplitude({}));
      assert.doesNotThrow(() => amplitude(null, {}));
      assert.doesNotThrow(() => amplitude({}, { events: {} }));
    },

    'flow.reset-password.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:58.0) Gecko/20100101 Firefox/58.0',
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'bar',
        entrypoint: 'baz',
        experiments: [
          {choice: 'FirstExperiment', group: 'groupOne'},
          {choice: 'second-experiment', group: 'Group-Two'},
          {choice: 'THIRD_EXPERIMENT', group: 'group_three'},
          {choice: 'fourth.experiment', group: 'Group.FOUR'}
        ],
        events: [
          {},
          { time: 'foo', type: 'flow.reset-password.submit' }
        ],
        flowBeginTime: 'qux',
        flowId: 'wibble',
        lang: 'blee',
        service: '1',
        uid: 'soop',
        utm_campaign: 'melm',
        utm_content: 'florg',
        utm_medium: 'derp',
        utm_source: 'bnag',
        utm_term: 'plin'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const args = process.stderr.write.args[0];
      assert.lengthOf(args, 1);
      assert.typeOf(args[0], 'string');
      assert.equal(args[0][args[0].length - 1], '\n');
      assert.deepEqual(JSON.parse(args[0]), {
        app_version: APP_VERSION,
        country: 'United States',
        device_id: 'bar',
        event_properties: {
          oauth_client_id: '1',
          service: 'pocket'
        },
        event_type: 'fxa_login - forgot_submit',
        language: 'blee',
        op: 'amplitudeEvent',
        os_name: 'Mac OS X',
        os_version: '10.11',
        region: 'California',
        session_id: 'qux',
        time: 'foo',
        user_id: 'soop',
        user_properties: {
          entrypoint: 'baz',
          flow_id: 'wibble',
          ua_browser: 'Firefox',
          ua_version: '58.0',
          utm_campaign: 'melm',
          utm_content: 'florg',
          utm_medium: 'derp',
          utm_source: 'bnag',
          utm_term: 'plin',
          '$append': {
            experiments: [
              'first_experiment_group_one',
              'second_experiment_group_two',
              'third_experiment_group_three',
              'fourth_experiment_group_four'
            ],
            fxa_services_used: 'pocket'
          }
        }
      });
    },

    'settings.change-password.success': () => {
      amplitude({
        connection: {},
        headers: {
          'user-agent': 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A406 Safari/8536.25',
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'b',
        entrypoint: 'c',
        events: [
          { time: 'a', type: 'settings.change-password.success' }
        ],
        experiments: [],
        flowBeginTime: 'd',
        flowId: 'e',
        lang: 'f',
        service: 'g',
        uid: 'h',
        utm_campaign: 'i',
        utm_content: 'j',
        utm_medium: 'k',
        utm_source: 'l',
        utm_term: 'm'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.deepEqual(arg, {
        app_version: APP_VERSION,
        country: 'United States',
        device_id: 'b',
        device_model: 'iPad',
        event_properties: {
          oauth_client_id: 'g',
          service: 'undefined_oauth'
        },
        event_type: 'fxa_pref - password',
        language: 'f',
        op: 'amplitudeEvent',
        os_name: 'iOS',
        os_version: '6.0',
        region: 'California',
        session_id: 'd',
        time: 'a',
        user_id: 'h',
        user_properties: {
          '$append': {
            fxa_services_used: 'undefined_oauth'
          },
          entrypoint: 'c',
          flow_id: 'e',
          ua_browser: 'Mobile Safari',
          ua_version: '6.0',
          utm_campaign: 'i',
          utm_content: 'j',
          utm_medium: 'k',
          utm_source: 'l',
          utm_term: 'm'
        }
      });
    },

    'settings.clients.disconnect.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'b',
        events: [
          { time: 'a', type: 'settings.clients.disconnect.submit' }
        ],
        flowBeginTime: 'c',
        flowId: 'd',
        lang: 'e',
        uid: 'f'
      });
      assert.equal(process.stderr.write.callCount, 0);
    },

    'settings.clients.disconnect.submit.suspicious': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'none',
        events: [
          { time: 'a', type: 'settings.clients.disconnect.submit.suspicious' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        lang: 'd',
        uid: 'none'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_pref - disconnect_device');
      assert.equal(arg.event_properties.reason, 'suspicious');
      assert.isUndefined(arg.device_id);
      assert.isUndefined(arg.user_id);
    },

    'settings.clients.disconnect.submit.duplicate': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'b',
        events: [
          { time: 'a', type: 'settings.clients.disconnect.submit.duplicate' }
        ],
        flowBeginTime: 'c',
        flowId: 'd',
        lang: 'e',
        uid: 'f'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_pref - disconnect_device');
      assert.equal(arg.event_properties.reason, 'duplicate');
    },

    'settings.signout.success': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'settings.signout.success' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_pref - logout');
    },

    'flow.enter-email.engage': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.enter-email.engage' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_email_first - engage');
    },

    'flow.force-auth.engage': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.force-auth.engage' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_login - engage');
    },

    'flow.signin.engage': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.signin.engage' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_login - engage');
    },

    'flow.signup.engage': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'b',
        entrypoint: 'c',
        events: [
          { time: 'a', type: 'flow.signup.engage' }
        ],
        flowBeginTime: 'd',
        flowId: 'e',
        lang: 'f',
        service: '2',
        uid: 'h',
        utm_campaign: 'i',
        utm_content: 'j',
        utm_medium: 'k',
        utm_source: 'l',
        utm_term: 'm'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_reg - engage');
      assert.deepEqual(arg, {
        app_version: APP_VERSION,
        country: 'United States',
        device_id: 'b',
        event_properties: {
          oauth_client_id: '2',
          service: 'undefined_oauth'
        },
        event_type: 'fxa_reg - engage',
        language: 'f',
        op: 'amplitudeEvent',
        region: 'California',
        session_id: 'd',
        time: 'a',
        user_id: 'h',
        user_properties: {
          '$append': {
            fxa_services_used: 'undefined_oauth'
          },
          entrypoint: 'c',
          flow_id: 'e',
          utm_campaign: 'i',
          utm_content: 'j',
          utm_medium: 'k',
          utm_source: 'l',
          utm_term: 'm'
        }
      });
    },

    'flow.sms.engage': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.sms.engage' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_connect_device - engage');
      assert.equal(arg.event_properties.connect_device_flow, 'sms');
      assert.equal(arg.event_properties.connect_device_os, undefined);
    },

    'flow.reset-password.engage': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.reset-password.engage' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });
      assert.equal(process.stderr.write.callCount, 0);
    },

    'flow.install_from.foo': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.install_from.foo' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_connect_device - view');
      assert.equal(arg.event_properties.connect_device_flow, 'store_buttons');
      assert.equal(arg.event_properties.connect_device_os, undefined);
    },

    'flow.signin_from.bar': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.signin_from.bar' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_connect_device - view');
      assert.equal(arg.event_properties.connect_device_flow, 'signin');
      assert.equal(arg.event_properties.connect_device_os, undefined);
    },

    'flow.connect-another-device.link.app-store.foo': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.connect-another-device.link.app-store.foo' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_connect_device - engage');
      assert.equal(arg.event_properties.connect_device_flow, 'store_buttons');
      assert.equal(arg.event_properties.connect_device_os, 'foo');
    },

    'flow.signin.forgot-password': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.signin.forgot-password' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_login - forgot_pwd');
    },

    'flow.signin.have-account': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.signin.have-account' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_reg - have_account');
    },

    'flow.enter-email.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.enter-email.submit' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_email_first - submit');
    },

    'flow.force-auth.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.signin.submit' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_login - submit');
    },

    'flow.signin.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.signin.submit' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_login - submit');
    },

    'flow.signup.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.signup.submit' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_reg - submit');
    },

    'flow.sms.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.sms.submit' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_connect_device - submit');
      assert.equal(arg.event_properties.connect_device_flow, 'sms');
      assert.equal(arg.event_properties.connect_device_os, undefined);
    },

    'flow.wibble.submit': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'flow.wibble.submit' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });
      assert.equal(process.stderr.write.callCount, 0);
    },

    'screen.enter-email': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'screen.enter-email' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_email_first - view');
    },

    'screen.force-auth': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'screen.force-auth' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_login - view');
    },

    'screen.signin': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'screen.signin' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_login - view');
    },

    'screen.signup': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'screen.signup' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_reg - view');
    },

    'screen.settings': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'screen.settings' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_pref - view');
    },

    'screen.sms': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'b',
        entrypoint: 'c',
        events: [
          { time: 'a', type: 'screen.sms' }
        ],
        flowBeginTime: 'd',
        flowId: 'e',
        lang: 'f',
        service: 'g',
        uid: 'h',
        utm_campaign: 'i',
        utm_content: 'j',
        utm_medium: 'k',
        utm_source: 'l',
        utm_term: 'm'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.deepEqual(arg, {
        app_version: APP_VERSION,
        country: 'United States',
        device_id: 'b',
        event_properties: {
          connect_device_flow: 'sms',
          oauth_client_id: 'g',
          service: 'undefined_oauth'
        },
        event_type: 'fxa_connect_device - view',
        language: 'f',
        op: 'amplitudeEvent',
        region: 'California',
        session_id: 'd',
        time: 'a',
        user_id: 'h',
        user_properties: {
          '$append': {
            fxa_services_used: 'undefined_oauth'
          },
          entrypoint: 'c',
          flow_id: 'e',
          utm_campaign: 'i',
          utm_content: 'j',
          utm_medium: 'k',
          utm_source: 'l',
          utm_term: 'm'
        }
      });
    },

    'screen.reset-password': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'screen.reset-password' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });
      assert.equal(process.stderr.write.callCount, 0);
    },

    'settings.communication-preferences.optIn.success': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'settings.communication-preferences.optIn.success' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_pref - newsletter');
      assert.equal(arg.user_properties.newsletter_state, 'subscribed');
    },

    'settings.communication-preferences.optOut.success': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'settings.communication-preferences.optOut.success' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_pref - newsletter');
      assert.equal(arg.user_properties.newsletter_state, 'unsubscribed');
    },

    'settings.communication-preferences.wibble.success': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'settings.communication-preferences.wibble.success' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });
      assert.equal(process.stderr.write.callCount, 0);
    },

    'complete-reset-password.verification.clicked': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        deviceId: 'b',
        emailDomain: 'other',
        entrypoint: 'c',
        events: [
          { time: 'a', type: 'complete-reset-password.verification.clicked' }
        ],
        flowBeginTime: 'd',
        flowId: 'e',
        lang: 'f',
        service: 'sync',
        uid: 'h',
        utm_campaign: 'i',
        utm_content: 'j',
        utm_medium: 'k',
        utm_source: 'l',
        utm_term: 'm'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.deepEqual(arg, {
        app_version: APP_VERSION,
        country: 'United States',
        device_id: 'b',
        event_properties: {
          email_provider: 'other',
          email_type: 'reset_password',
          service: 'sync'
        },
        event_type: 'fxa_email - click',
        language: 'f',
        op: 'amplitudeEvent',
        region: 'California',
        session_id: 'd',
        time: 'a',
        user_id: 'h',
        user_properties: {
          '$append': {
            fxa_services_used: 'sync'
          },
          entrypoint: 'c',
          flow_id: 'e',
          utm_campaign: 'i',
          utm_content: 'j',
          utm_medium: 'k',
          utm_source: 'l',
          utm_term: 'm'
        }
      });
    },

    'complete-signin.verification.clicked': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        emailDomain: 'none',
        events: [
          { time: 'a', type: 'complete-signin.verification.clicked' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_email - click');
      assert.equal(arg.event_properties.email_provider, undefined);
      assert.equal(arg.event_properties.email_type, 'login');
    },

    'verify-email.verification.clicked': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'verify-email.verification.clicked' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });

      assert.equal(process.stderr.write.callCount, 1);
      const arg = JSON.parse(process.stderr.write.args[0]);
      assert.equal(arg.event_type, 'fxa_email - click');
      assert.equal(arg.event_properties.email_provider, undefined);
      assert.equal(arg.event_properties.email_type, 'registration');
    },

    'wibble.verification.success': () => {
      amplitude({
        connection: {},
        headers: {
          'x-forwarded-for': '63.245.221.32'
        }
      }, {
        events: [
          { time: 'a', type: 'wibble.verification.success' }
        ],
        flowBeginTime: 'b',
        flowId: 'c',
        uid: 'd'
      });
      assert.equal(process.stderr.write.callCount, 0);
    }
  }
});

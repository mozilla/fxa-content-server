/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/node!got',
  'intern/dojo/node!fs',
  'intern/dojo/node!path'
], function (intern, registerSuite, assert, config, got, fs, path) {
  var serverUrl = intern.config.fxaContentRoot.replace(/\/$/, '');

  var suite = {
    name: 'metrics'
  };

  const VALID_METRICS =
    JSON.parse(fs.readFileSync('tests/server/fixtures/metrics_valid.json'));
  const INVALID_METRICS_OVERWRITE_TOSTRING_METHOD =
    JSON.parse(fs.readFileSync('tests/server/fixtures/metrics_overwrite_toString.json'));

  suite['#post /metrics - returns 200'] = function () {
    return got.post(serverUrl + '/metrics', {
      body: JSON.stringify(VALID_METRICS),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((res) => {
      assert.equal(res.statusCode, 200);
    });
  };

  suite['#post /metrics - returns 200 if Content-Type is text/plain'] = function () {
    return got.post(serverUrl + '/metrics', {
      body: JSON.stringify(VALID_METRICS),
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    }).then((res) => {
      assert.equal(res.statusCode, 200);
    });
  };

  suite['#post /metrics - returns 400 with invalid data'] = {
    'empty body': () => testInvalidMetricsData(''),
    'invalid broker': testInvalidMetricsField('broker', '#'),
    'invalid context': testInvalidMetricsField('context', '!'),
    'invalid duration': testInvalidMetricsField('duration', -1),
    'invalid entryPoint': testInvalidMetricsField('entrypoint', '15612!$@%%asdf<>'),
    'invalid entrypoint': testInvalidMetricsField('entrypoint', '!%!%'),
    'invalid event offset': testInvalidMetricsField('events', [{ offset: 'a', type: 'allgood'}]),
    'invalid event type': testInvalidMetricsField('events', [{ offset: 12, type: '<owned>'}]),
    'invalid events': testInvalidMetricsField('events', {}),
    'invalid experiment choice': testInvalidMetricsField('experiments', { choice: {}, group: 'treatment'}),
    'invalid experiment group': testInvalidMetricsField('experiments', { choice: 'choice', group: '1255{}'}),
    'invalid experiments': testInvalidMetricsField('experiments', '123'),
    'invalid flowBeginTime': testInvalidMetricsField('flowBeginTime', 'asdf'),
    'invalid flowId': testInvalidMetricsField('flowId', 'deadbeef'),
    'invalid flushTime': testInvalidMetricsField('flushTime', '<script>'),
    'invalid isSampledUser': testInvalidMetricsField('isSampledUser', 'no'),
    'invalid lang': testInvalidMetricsField('lang', 'es:ES'),
    'invalid marketing': testInvalidMetricsField('marketing', {}),
    'invalid marketing campaignId': testInvalidMetricsField('marketing', [{ campaignId: 'l33t!@$', clicked: true, url: 'https://thestore.com' }]),
    'invalid marketing clicked': testInvalidMetricsField('marketing', [{ campaignId: 'marketing123', clicked: {}, url: 'https://thestore.com' }]),
    'invalid marketing url': testInvalidMetricsField('marketing', [{ campaignId: 'marketing123', clicked: true, url: 'notaurl' }]),
    'invalid migration': testInvalidMetricsField('migration', 'not-valid'),
    'invalid navigationTiming': testInvalidMetricsField('navigationTiming', []),
    'invalid navigationTiming connectEnd': testInvalidNavigationTimingField('connectEnd', 'asdf'),
    'invalid navigationTiming connectStart': testInvalidNavigationTimingField('connectStart', undefined),
    'invalid navigationTiming domComplete': testInvalidNavigationTimingField('domComplete', '#$'),
    'invalid navigationTiming domContentLoadedEventEnd': testInvalidNavigationTimingField('domContentLoadedEventEnd', ''),
    'invalid navigationTiming domContentLoadedEventStart': testInvalidNavigationTimingField('domContentLoadedEventStart', '55a'),
    'invalid navigationTiming domInteractive': testInvalidNavigationTimingField('domInteractive', 'a55'),
    'invalid navigationTiming domLoading': testInvalidNavigationTimingField('domLoading', '""'),
    'invalid navigationTiming domainLookupEnd': testInvalidNavigationTimingField('domainLookupEnd', '|'),
    'invalid navigationTiming domainLookupStart': testInvalidNavigationTimingField('domainLookupStart', '0u000'),
    'invalid navigationTiming fetchStart': testInvalidNavigationTimingField('fetchStart', '<>'),
    'invalid navigationTiming loadEventEnd': testInvalidNavigationTimingField('loadEventEnd', '   '),
    'invalid navigationTiming loadEventStart': testInvalidNavigationTimingField('loadEventStart', '+='),
    'invalid navigationTiming navigationStart': testInvalidNavigationTimingField('navigationStart', '*'),
    'invalid navigationTiming redirectEnd': testInvalidNavigationTimingField('redirectEnd', ' '),
    'invalid navigationTiming redirectStart': testInvalidNavigationTimingField('redirectStart', '\\'),
    'invalid navigationTiming requestStart': testInvalidNavigationTimingField('requestStart', {}),
    'invalid navigationTiming responseEnd': testInvalidNavigationTimingField('responseEnd', []),
    'invalid navigationTiming responseStart': testInvalidNavigationTimingField('responseStart', true),
    'invalid navigationTiming secureConnectionStart': testInvalidNavigationTimingField('secureConnectionStart', false),
    'invalid navigationTiming unloadEventEnd': testInvalidNavigationTimingField('unloadEventEnd', '&'),
    'invalid navigationTiming unloadEventStart': testInvalidNavigationTimingField('unloadEventStart', '[]'),
    'invalid numStoredAccounts': testInvalidMetricsField('numStoredAccounts', {}),
    'invalid referrer - not a url': testInvalidMetricsField('referrer', 'not a url'),
    'invalid screen': testInvalidMetricsField('screen', 'not an object'),
    'invalid screen clientHeight': testInvalidMetricsField('screen', { clientHeight: null, clientWidth: 12, devicePixelRatio: 2.3, height: 31, width: 32}),
    'invalid screen clientWidth': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 'a', devicePixelRatio: 2.3, height: 31, width: 32}),
    'invalid screen devicePixelRatio': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 12, devicePixelRatio: 'b', height: 31, width: 32}),
    'invalid screen height': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 12, devicePixelRatio: 2.3, height: undefined, width: 32}),
    'invalid screen width': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 12, devicePixelRatio: 2.3, height: 31, width: 'f'}),
    'invalid service': testInvalidMetricsField('service', '124154adf123124242123'),
    'invalid startTime': testInvalidMetricsField('startTime', true),
    'invalid timers': testInvalidMetricsField('timers', []),
    'invalid uniqueUserId': testInvalidMetricsField('uniqueUserId', '123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123'),
    'invalid utm_campaign': testInvalidMetricsField('utm_campaign', '#'),
    'invalid utm_content': testInvalidMetricsField('utm_content', '!'),
    'invalid utm_medium': testInvalidMetricsField('utm_medium', ','),
    'invalid utm_source': testInvalidMetricsField('utm_source', '>'),
    'invalid utm_term': testInvalidMetricsField('utm_term', '?'),
    'overwrite `toString` method': () => testInvalidMetricsData(INVALID_METRICS_OVERWRITE_TOSTRING_METHOD)
  };

  function testInvalidMetricsField(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics[fieldName] = fieldValue;
      return testInvalidMetricsData(metrics);
    };
  }

  function testInvalidNavigationTimingField(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics.navigationTiming[fieldName] = fieldValue;
      return testInvalidMetricsData(metrics);
    };
  }

  function testInvalidMetricsData(body) {
    return got.post(serverUrl + '/metrics', {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    }).then(assert.fail, (res) => {
      assert.equal(res.statusCode, 400);
    });
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  registerSuite(suite);
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var assert = require('chai').assert;
  var MetricsContext = require('models/metrics-context');

  describe('models/metrics-context', function () {
    var mockRelier, metricsContext;

    beforeEach(function () {
      mockRelier = {
        attributes: {
          context: 'mock context',
          entrypoint: 'mock entrypoint',
          flowBeginTime: 'mock flowBeginTime',
          flowId: 'mock flowId',
          migration: 'mock migration',
          service: 'mock service',
          utmCampaign: 'mock utmCampaign',
          utmContent: 'mock utmContent',
          utmMedium: 'mock utmMedium',
          utmSource: 'mock utmSource',
          utmTerm: 'mock utmTerm',
          wibble: 'blee'
        }
      };
      metricsContext = new MetricsContext({ relier: mockRelier });
    });

    it('set initial attributes correctly', function () {
      assert.lengthOf(Object.keys(metricsContext.attributes), 12);
      assert.equal(metricsContext.get('context'), 'mock context');
      assert.equal(metricsContext.get('entrypoint'), 'mock entrypoint');
      assert.equal(metricsContext.get('migration'), 'mock migration');
      assert.equal(metricsContext.get('service'), 'mock service');
      assert.equal(metricsContext.get('utmCampaign'), 'mock utmCampaign');
      assert.equal(metricsContext.get('utmContent'), 'mock utmContent');
      assert.equal(metricsContext.get('utmMedium'), 'mock utmMedium');
      assert.equal(metricsContext.get('utmSource'), 'mock utmSource');
      assert.equal(metricsContext.get('utmTerm'), 'mock utmTerm');
      assert.isUndefined(metricsContext.get('flowBeginTime'));
      assert.isUndefined(metricsContext.get('flowId'));
      assert.isUndefined(metricsContext.get('wibble'));
    });

    describe('metricsContext.set flowBeginTime', function () {
      beforeEach(function () {
        metricsContext.set('flowBeginTime', 'foo');
      });

      it('set flowBeginTime correctly', function () {
        assert.equal(metricsContext.get('flowBeginTime'), 'foo');
      });
    });

    describe('set flowId correctly', function () {
      beforeEach(function () {
        metricsContext.set('flowId', 'foo');
      });

      it('returned a different result object', function () {
        assert.equal(metricsContext.get('flowId'), 'foo');
      });
    });
  });
});


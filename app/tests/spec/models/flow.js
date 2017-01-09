/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const $ = require('jquery');
  const assert = require('chai').assert;
  const AuthErrors = require('lib/auth-errors');
  const Flow = require('models/flow');
  const ResumeToken = require('models/resume-token');
  const sinon = require('sinon');
  const Url = require('lib/url');
  const WindowMock = require('../../mocks/window');

  const BODY_FLOW_ID = 'F1031DF1031DF1031DF1031DF1031DF1031DF1031DF1031DF1031DF1031DF103';
  const BODY_FLOW_BEGIN_TIME = 1484931996866;
  const RESUME_FLOW_ID = '71031D71031D71031D71031D71031D71031D71031D71031D71031D71031D7103';
  const RESUME_FLOW_BEGIN_TIME = 1484932012514;

  describe('models/flow', () => {
    let flow;
    let sentryMetricsMock;
    let windowMock;
    let $body;

    beforeEach(() => {
      sentryMetricsMock = {
        captureException: sinon.spy()
      };
      windowMock = new WindowMock();
      $body = $(windowMock.document.body);
      $body.removeAttr('data-flow-id');
      $body.removeAttr('data-flow-begin');
    });

    function createFlow () {
      flow = new Flow({
        sentryMetrics: sentryMetricsMock,
        window: windowMock
      });
    }

    it('fetches from the `resume` search parameter, if available', () => {
      windowMock.location.search = Url.objToSearchString({
        resume: ResumeToken.stringify({ flowBegin: RESUME_FLOW_BEGIN_TIME, flowId: RESUME_FLOW_ID })
      });

      createFlow();

      assert.equal(flow.get('flowId'), RESUME_FLOW_ID);
      assert.equal(flow.get('flowBegin'), RESUME_FLOW_BEGIN_TIME);
    });

    it('fetches from body data attributes, if available', () => {
      $body.attr('data-flow-id', BODY_FLOW_ID);
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();

      assert.equal(flow.get('flowId'), BODY_FLOW_ID);
      assert.equal(flow.get('flowBegin'), BODY_FLOW_BEGIN_TIME);
    });

    it('gives preference to values from the `resume` search parameter', () => {
      windowMock.location.search = Url.objToSearchString({
        resume: ResumeToken.stringify({ flowBegin: RESUME_FLOW_BEGIN_TIME, flowId: RESUME_FLOW_ID })
      });
      $body.attr('data-flow-id', BODY_FLOW_ID);
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();

      assert.equal(flow.get('flowId'), RESUME_FLOW_ID);
      assert.equal(flow.get('flowBegin'), RESUME_FLOW_BEGIN_TIME);
    });

    it('logs an error when the resume token contains `flowId` but not `flowBegin`', () => {
      windowMock.location.search = Url.objToSearchString({
        resume: ResumeToken.stringify({ flowId: RESUME_FLOW_ID })
      });
      $body.attr('data-flow-id', BODY_FLOW_ID);
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();

      assert.equal(flow.get('flowId'), RESUME_FLOW_ID);
      assert.notOk(flow.has('flowBegin'));

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'MISSING_RESUME_TOKEN_PROPERTY'));
      assert.strictEqual(args[0].property, 'flowBegin');
    });

    it('logs an error when the resume token contains `flowBegin` but not `flowId`', () => {
      windowMock.location.search = Url.objToSearchString({
        resume: ResumeToken.stringify({ flowBegin: RESUME_FLOW_BEGIN_TIME })
      });
      $body.attr('data-flow-id', BODY_FLOW_ID);
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();

      assert.notOk(flow.has('flowId'));
      assert.equal(flow.get('flowBegin'), RESUME_FLOW_BEGIN_TIME);

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'MISSING_RESUME_TOKEN_PROPERTY'));
      assert.strictEqual(args[0].property, 'flowId');
    });

    it('logs an error when the DOM contains `flowId` but not `flowBegin`', () => {
      $body.attr('data-flow-id', BODY_FLOW_ID);

      createFlow();

      assert.equal(flow.get('flowId'), BODY_FLOW_ID);
      assert.notOk(flow.has('flowBegin'));

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'MISSING_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowBegin');
    });

    it('logs an error when the DOM contains `flowBegin` but not `flowId`', () => {
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();

      assert.notOk(flow.has('flowId'));
      assert.equal(flow.get('flowBegin'), BODY_FLOW_BEGIN_TIME);

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'MISSING_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowId');
    });

    it('logs two errors when there is no flow data available', () => {
      createFlow();

      assert.notOk(flow.has('flowId'));
      assert.notOk(flow.has('flowBegin'));

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 2);

      let args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'MISSING_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowId');

      args = sentryMetricsMock.captureException.args[1];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'MISSING_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowBegin');
    });

    it('logs an error when `data-flow-id` is too short', () => {
      $body.attr('data-flow-id', '123456');
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();

      assert.notOk(flow.has('flowId'));
      assert.equal(flow.get('flowBegin'), BODY_FLOW_BEGIN_TIME);

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'INVALID_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowId');
    });

    it('logs an error when `data-flow-id` is not a hex string', () => {
      $body.attr('data-flow-id', BODY_FLOW_ID.substr(0, 63) + 'X');
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();

      assert.notOk(flow.has('flowId'));
      assert.equal(flow.get('flowBegin'), BODY_FLOW_BEGIN_TIME);

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'INVALID_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowId');
    });

    it('logs an error when `data-flow-begin` is not a number', () => {
      $body.attr('data-flow-id', BODY_FLOW_ID);
      $body.attr('data-flow-begin', 'forty-two');

      createFlow();

      assert.equal(flow.get('flowId'), BODY_FLOW_ID);
      assert.notOk(flow.has('flowBegin'));

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'INVALID_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowBegin');
    });

    it('logs an error when `data-flow-begin` is not an integer', () => {
      $body.attr('data-flow-id', BODY_FLOW_ID);
      $body.attr('data-flow-begin', '3.14159265');

      createFlow();

      assert.equal(flow.get('flowId'), BODY_FLOW_ID);
      assert.notOk(flow.has('flowBegin'));

      assert.strictEqual(sentryMetricsMock.captureException.callCount, 1);
      const args = sentryMetricsMock.captureException.args[0];
      assert.lengthOf(args, 1);
      assert.isTrue(AuthErrors.is(args[0], 'INVALID_DATA_ATTRIBUTE'));
      assert.strictEqual(args[0].property, 'flowBegin');
    });

    it('removes data attributes when destroy is called', () => {
      $body.attr('data-flow-id', BODY_FLOW_ID);
      $body.attr('data-flow-begin', BODY_FLOW_BEGIN_TIME);

      createFlow();
      flow.destroy();

      assert.isUndefined($body.attr('data-flow-id'));
      assert.isUndefined($body.attr('data-flow-begin'));
    });
  });
});


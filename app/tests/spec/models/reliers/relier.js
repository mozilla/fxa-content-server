/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

define([
  'chai',
  'lib/constants',
  'lib/resume-token',
  'models/reliers/relier',
  '../../../mocks/window',
  '../../../lib/helpers'
], function (chai, Constants, ResumeToken, Relier, WindowMock, TestHelpers) {
  var assert = chai.assert;

  describe('models/reliers/relier', function () {
    var relier;
    var windowMock;

    var SERVICE = 'service';
    var SYNC_SERVICE = 'sync';
    var PREVERIFY_TOKEN = 'abigtoken';
    var EMAIL = 'email';
    var UID = 'uid';
    var ENTRYPOINT = 'preferences';
    var CAMPAIGN = 'fennec';
    var CAMPAIGN_ALTERNATE = 'spring2015';

    beforeEach(function () {
      windowMock = new WindowMock();

      relier = new Relier({
        window: windowMock
      });
    });

    describe('fetch', function () {
      it('populates expected fields from the search parameters, unexpected search parameters are ignored', function () {
        windowMock.location.search = TestHelpers.toSearchString({
          preVerifyToken: PREVERIFY_TOKEN,
          service: SERVICE,
          email: EMAIL,
          uid: UID,
          entrypoint: ENTRYPOINT,
          campaign: CAMPAIGN,
          ignored: 'ignored'
        });

        return relier.fetch()
            .then(function () {
              assert.equal(relier.get('preVerifyToken'), PREVERIFY_TOKEN);
              assert.equal(relier.get('service'), SERVICE);
              assert.equal(relier.get('email'), EMAIL);
              assert.equal(relier.get('uid'), UID);
              assert.equal(relier.get('entrypoint'), ENTRYPOINT);
              assert.equal(relier.get('campaign'), CAMPAIGN);
              assert.isFalse(relier.has('ignored'));
            });
      });

      it('restores fields from the resume param, but prefers values from search params', function () {
        var resumeData = {
          metrics: true,
          campaign: CAMPAIGN_ALTERNATE
        };
        var resumeToken = ResumeToken.stringify(resumeData);

        windowMock.location.search = TestHelpers.toSearchString({
          resume: resumeToken,
          campaign: CAMPAIGN
        });

        return relier.fetch()
          .then(function () {
            assert.equal(relier.get('metrics'), true);
            assert.equal(relier.get('campaign'), CAMPAIGN);
          });
      });
    });

    describe('isOAuth', function () {
      it('returns `false`', function () {
        assert.isFalse(relier.isOAuth());
      });
    });

    describe('isFxDesktop', function () {
      it('returns `false`', function () {
        assert.isFalse(relier.isFxDesktop());
      });
    });

    describe('getResumeToken', function () {
      it('returns null by default', function () {
        assert.isNull(relier.getResumeToken());
      });

      it('saves campaign, entrypoint and metrics fields if present', function () {
        relier.set('metrics', true);
        relier.set('campaign', CAMPAIGN);
        assert.deepEqual(ResumeToken.parse(relier.getResumeToken()), {
          metrics: true,
          campaign: CAMPAIGN
        });
        relier.set('entrypoint', ENTRYPOINT);
        assert.deepEqual(ResumeToken.parse(relier.getResumeToken()), {
          metrics: true,
          campaign: CAMPAIGN,
          entrypoint: ENTRYPOINT
        });
      });
    });

    describe('_parseResumeToken', function () {
      it('restores known fields from the resume param', function () {
        var resumeData = {
          metrics: false,
          campaign: CAMPAIGN,
          extraField: 'shouldBeIgnored'
        };
        var resumeToken = ResumeToken.stringify(resumeData);

        windowMock.location.search = TestHelpers.toSearchString({
          resume: resumeToken
        });

        return relier.fetch()
          .then(function () {
            assert.equal(relier.get('metrics'), false);
            assert.equal(relier.get('campaign'), CAMPAIGN);
            assert.isUndefined(relier.get('extraField'), 'only allow specific resume token values');
          });
      });
    });

    describe('isSync', function () {
      it('returns true if `service=sync`', function () {
        windowMock.location.search = TestHelpers.toSearchString({
          service: SYNC_SERVICE
        });

        return relier.fetch()
            .then(function () {
              assert.isTrue(relier.isSync());
            });
      });

      it('returns false otw', function () {
        windowMock.location.search = TestHelpers.toSearchString({
          service: SERVICE
        });

        return relier.fetch()
            .then(function () {
              assert.isFalse(relier.isSync());
            });
      });
    });

    describe('allowCachedCredentials', function () {
      it('returns `true` if `email` not set', function () {
        return relier.fetch()
          .then(function () {
            assert.isTrue(relier.allowCachedCredentials());
          });
      });

      it('returns `true` if `email` is set to an email address', function () {
        windowMock.location.search = TestHelpers.toSearchString({
          email: 'testuser@testuser.com'
        });

        return relier.fetch()
          .then(function () {
            assert.isTrue(relier.allowCachedCredentials());
          });
      });

      it('returns `false` if `email` is set to `blank`', function () {
        windowMock.location.search = TestHelpers.toSearchString({
          email: Constants.DISALLOW_CACHED_CREDENTIALS
        });

        return relier.fetch()
          .then(function () {
            assert.isFalse(relier.allowCachedCredentials());

            // the email should not be set on the relier model
            // if the specified email === blank
            assert.isFalse(relier.has('email'));
          });
      });
    });
  });
});


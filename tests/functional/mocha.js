/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/Deferred',
  'require',
  'intern/node_modules/dojo/has!host-node?intern/node_modules/dojo/node!child_process'
], function (intern, registerSuite, assert, config, Deferred, require, child_process) {
  'use strict';

  var url = intern.config.fxaContentRoot + 'tests/index.html?coverage';
  var bodyText;

  registerSuite({
    name: 'mocha tests',

    'run the mocha tests': function () {
      var self = this;
      // timeout after 200 seconds
      this.timeout = 200000;

      return this.get('remote')
        .get(require.toUrl(url))
        .setFindTimeout(intern.config.pageLoadTimeout)
        // wait for the tests to complete
        .findById('total-failures')
        .end()
        //
        // Save the body text in case there are any errors
        .findByCssSelector('body')
        .getVisibleText()
          .then(function (text) {
            bodyText = text;
          })
        .end()

        // Check for any failures, if there is a failure, print the
        // test log and fail.
        .findById('total-failures')
        .getVisibleText()
          .then(function (text) {
            if (text !== '0') {
              console.log(bodyText);
            }
            assert.equal(text, '0');
          })
        .end()

        .then(function () {
          if (true) {
            return sendCoverageToCoveralls(self);
          } else {

          }
        })
/*
        // check for the grand total
        .findByCssSelector('.grand-total .rs')
        .getVisibleText()
          .then(function (text) {
            text = text.replace('%', '').trim();
            var covered = parseFloat(text);
            assert.ok(covered > config.get('tests.coverage.globalThreshold'),
                'code coverage is insufficient at ' + text + '%');
          })
        .end()*/

        // any individual failures?
        .setFindTimeout(3000)
        .findByCssSelector('.bl-error .bl-file a')
        .then(
          function() {
            throw new Error('Blanket.js Errors');
          },
          function(err) {
            // No Blanket.js errors
            assert.strictEqual(err.name, 'NoSuchElement', 'Error was: ' + err.message);
          }
        )
        .end();

    }
  });

  /**
   * Sends test coverage data to https://coveralls.io
   * This runs with Travis CI. It pipes "coverageData" gathered from "_$blanket_LCOV" LCOV reporter.
   *
   * @param {Test} context
   * @returns {Deferred}
   */
  function sendCoverageToCoveralls(context) {
    var dfd = new Deferred();
    var spawn = child_process.spawn;

    console.log('Sending code coverage to coveralls.io');
    context.get('remote')
    // get code coverage data
    .execute(function () {
      /* global window */
      return window._$blanket_LCOV;
    }, [])
    .then(function (coverageData) {
      var child = spawn('node', ['node_modules/coveralls/bin/coveralls.js']);
      child.on('error', function (err) {
        throw err;
      });
      child.stderr.on('data', function (data) {
        console.log(data.toString());
      });

      child.on('exit', function () {
        console.log('Code coverage sent');
        dfd.resolve();
      });
      child.stdin.write(coverageData);
      child.stdin.end();
    });

    return dfd;
  }
});

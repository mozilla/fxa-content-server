/*global describe, it, beforeEach, afterEach*/

define([
  'intern/chai!assert'
], function (assert) {
  var path = require('path');
  var exec = require('child_process').exec;
  var execOptions = {
    cwd: path.join(__dirname, '..')
  };

  var currentDir = process.cwd();

  describe('Test suite for malformed markup', function () {
    //var projectName = 'Malformed Markup Detection tests';

    it('prints the current directory and stdout', function (done) {
      console.log(currentDir);
      exec('grunt xss-parse', execOptions, function (error, stdout) {
        console.log(stdout);
      });
    });
  });
});

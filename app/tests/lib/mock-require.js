// https://www.symphonious.net/2013/07/08/injecting-stubsmocks-into-tests-with-require-js/
define([], function () {
  'use strict';

  var stubbed = [];
  return {
    stub: function (name, implementation) {
      stubbed.push(name);
      require.undef(name);
      define(name, [], function () {
        return implementation;
      });
    },
    loadWithCurrentStubs: function (name, callback) {
      stubbed.push(name);
      require.undef(name);
      require([name], callback);
    },
    reset: function () {
      stubbed.forEach(function (name) {
        require.undef(name);
      });
      stubbed = [];
    }
  };
});

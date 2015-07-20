define([], function () {
  'use strict';

  function isPromise(obj) {
    return obj && typeof obj.then === 'function';
  }

  var instances = {};

  return {
    load: function (name, req, onload, config) {

      function addInstance(inst) {
        instances[name] = inst;
        onload(inst);
      }

      if (instances[name]) {
        onload(instances[name]);
      } else {
        req([name], function (dep) {
          if (isPromise(dep)) {
            dep.then(addInstance, onload.error);
          } else {
            addInstance(dep);
          }
        });
      }
    }
  };
});

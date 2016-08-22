define(function (require, exports, module) {
  'use strict';

  return {
    captureException (err, extraContext) {
      console.error(String(err), extraContext);
    },

    config () {
      return this;
    },

    install () {
    },

    uninstall () {
    }
  };
});

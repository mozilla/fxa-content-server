/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Load modules asynchronously using requirejs. Useful to load modules
 * that are not part of the main bundle. Calls to load a module return
 * a promise that resolves once the module is loaded.
 *
 * Usage:
 * runtimeRequire('passwordcheck')
 *   .then(function (PasswordCheck) {
 *      // use PasswordCheck here.
 *   });
 */

define([
  'lib/promise'
], function (p) {
  'use strict';

  // An alias to require is used to prevent almond from bundling
  // the resource into the main bundle. instead, the item will
  // be loaded on demand, and the module returned when the promise
  // resolves.

  var getNow = require;
  var resources = {};

  return function (resourceToGet) {
    if (! resources[resourceToGet]) {
      var deferred = p.defer();

      // ensure only one request for the resource can be
      // done by caching the promise. When the promise resolves,
      // the loaded module will be returned to the caller.
      resources[resourceToGet] = deferred.promise;

      getNow([resourceToGet], deferred.resolve.bind(deferred));
    }

    return resources[resourceToGet];
  };
});


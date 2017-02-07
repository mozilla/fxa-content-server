/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 /**
  * Recursively render routes. On `change:route`, lookup the route definition
  * of the route. If the route definition has a parent, recursively render ancestors.
  * If the route definition has no parent, the parent is considered to be the `rootView`, which
  * is the AppView. Tell the route's parent to show the route's view as a child.
  *
  * @module route-renderer
  */

 define((require, exports, module) => {
   'use strict';

   const _ = require('underscore');
   const AppView = require('views/app');
   const Backbone = require('backbone');
   const Cocktail = require('cocktail');
   const NotifierMixin = require('lib/channels/notifier-mixin');
   const p = require('lib/promise');
   const Routes = require('lib/routes');

   const RouterRenderer = Backbone.Model.extend({
     initialize (options = {}) {
       this._createView = options.createView;
       this._window = options.window;

       this._createRootView();
     },

     _createRootView () {
       this._rootView = this._createView(AppView, {
         el: 'body'
       });
     },

     notifications: {
       'change:route': 'onChangeRoute'
     },

     onChangeRoute (event) {
       this.showRoute(event.currentPage, event);
     },

     /**
      * Get the route definition for `pathname`
      *
      * @param {String} pathname url pathname used to get the Route
      * @returns {Object} Route definition, if exists, undefined otw.
      */
     getRouteDefinition(pathname) {
       return Routes.get(pathname);
     },

     /**
      * Show a route for `pathname`
      *
      * @param {String} pathname url pathname to display
      * @param {Object} [options] options to pass to the constructor
      * @returns {Promise}
      */
     showRoute (pathname, options) {
       const routeDefinition = this.getRouteDefinition(pathname);
       if (! routeDefinition) {
         //return this.navigateAway('/404');
         // TODO log the lack of a pathname here.
         console.error('no pathname definition for', pathname);
         return;
       }

       return this.showRouteAncestors(pathname, options)
         .then((parentView) => {
           // showRouteAncestors will return false if an ancestor could not be
           // rendered for any reason, including if the view redirected
           if (parentView) {
             return this.showRouteOnParent(pathname, parentView, options);
           }
         })
         .then((childView) => {
           // showRouteOnParent will return false if the view could not be
           // rendered for any reason, including if the view redirected
           if (childView) {
             this.setTitle(childView.titleFromView());

             // logView is done outside of the view itself because the settings
             // page renders many child views at once. If the view took care of
             // logging itself, each child view would be logged at the same time.
             // We only want to log the screen being displayed, child views will
             // be logged when they are opened.
             childView.logView();
           }

           return childView;
         })
         .fail((err) => this.fatalError(err));
     },

     /**
      * Recursively show a pathname's ancestors until all are visible.
      * If a pathname has no explicit ancestors, this is the ancestor.
      *
      * @param {String} pathname url pathname to display
      * @param {Object} [options] options to pass to the constructor
      * @returns {Promise} resolves with the parent pathname when complete.
      *   Resolves to a falsey value if the parent was not rendered
      *   or has redirected.
      */
     showRouteAncestors (pathname, options) {
       return p().then(() => {
         const routeDefinition = this.getRouteDefinition(pathname);
         if (routeDefinition.parentRoute) {
           const parentOptions = _.extend({}, options, { hasChildren: true });
           return this.showRoute(routeDefinition.parentRoute, parentOptions);
         }

         return this._rootView;
       });
     },

     /**
      * Show a pathname on `parentView`
      *
      * @param {String} pathname url pathname to display
      * @param {Object} parentView
      * @param {Object} [options] options to pass to the constructor
      * @returns {Promise}
      */
     showRouteOnParent(pathname, parentView, options) {
       const routeDefinition = this.getRouteDefinition(pathname);
       const childOptions = _.extend({}, options, routeDefinition.options);
       return parentView.showChildView(routeDefinition.Constructor, childOptions);
     },

     /**
      * Set the window's title
      *
      * @param {String} title
      */
     setTitle (title) {
       this._window.document.title = title;
     }
   });

   Cocktail.mixin(
     RouterRenderer,
     NotifierMixin
   );

   module.exports = RouterRenderer;
 });

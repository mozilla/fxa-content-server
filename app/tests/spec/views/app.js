/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const $ = require('jquery');
  const AppView = require('views/app');
  const { assert } = require('chai');
  const AuthErrors = require('lib/auth-errors');
  const Backbone = require('backbone');
  const Environment = require('lib/environment');
  const KeyCodes = require('lib/key-codes');
  const Notifier = require('lib/channels/notifier');
  const p = require('lib/promise');
  const sinon = require('sinon');
  const WindowMock = require('../../mocks/window');

  describe('views/app', function () {
    let environment;
    let notifier;
    let view;
    let windowMock;

    function createDeps() {
      notifier = new Notifier();
      windowMock = new WindowMock();
      environment = new Environment(windowMock);

      $('#container').empty().append('<a href="/signup">Sign up</a><div id="stage"></stage>');
      view = new AppView({
        el: $('#container'),
        environment: environment,
        notifier: notifier,
        createView (Constructor, options) {
          return new Constructor(options);
        },
        window: windowMock
      });
    }

    describe('onAnchorClick', function () {
      let event;

      beforeEach(function () {
        createDeps();

        event = $.Event('click');
        event.currentTarget = $('a[href="/signup"]');
        sinon.spy(view, 'navigate');
      });

      function testNoNavigation() {
        view.onAnchorClick(event);
        assert.isFalse(view.navigate.called);
      }

      function setUpIFrameLink() {
        sinon.stub(environment, 'isFramed', function () {
          return true;
        });
        event.currentTarget = $('<a href="/legal/xyz">Legal Pages</a>');
      }

      it('does nothing if the event\'s default is prevented', function () {
        sinon.stub(event, 'isDefaultPrevented', function () {
          return true;
        });

        testNoNavigation();
      });

      it('does nothing if the the alt key is depressed during click', function () {
        event.altKey = true;

        testNoNavigation();
      });

      it('does nothing if the the ctrl key is depressed during click', function () {
        event.ctrlKey = true;

        testNoNavigation();
      });

      it('does nothing if the the meta key is depressed during click', function () {
        event.metaKey = true;

        testNoNavigation();
      });

      it('does nothing if the the shift key is depressed during click', function () {
        event.shiftKey = true;

        testNoNavigation();
      });

      it('does not call navigate if inside an iframe', function () {
        setUpIFrameLink();

        testNoNavigation();
      });

      it('opens a new window if inside an iframe', function () {
        setUpIFrameLink();

        sinon.spy(windowMock, 'open');
        view.onAnchorClick(event);
        assert.isTrue(windowMock.open.called);
      });

      it('navigates otherwise', function () {
        view.onAnchorClick(event);

        assert.isTrue(view.navigate.calledWith('signup'));
      });
    });

    describe('setTitle', function () {
      it('sets the document title', function () {
        view.setTitle('Foo');
        assert.equal(windowMock.document.title, 'Foo');
      });
    });

    describe('showRoute', () => {
      let ChildView;
      let View;

      beforeEach(() => {
        createDeps();

        View = Backbone.View.extend({
          logView () {

          },

          showChildView () {

          },

          titleFromView () {

          }
        });

        ChildView = View.extend({});

        sinon.stub(view, 'getRouteDefinition', (route) => {
          return {
            'route-that-errors': {
              Constructor: View
            },
            'route-that-renders': {
              Constructor: View
            },
            'route-with-parent': {
              Constructor: ChildView,
              parentRoute: 'route-that-renders'
            }
          }[route];
        });

        sinon.spy(view, 'fatalError');
      });

      describe('with a route that does not exist', () => {
        beforeEach(function () {
          sinon.spy(view, 'navigateAway');

          return view.showRoute('route-that-does-not-exist', {});
        });

        it('redirects to `/404`', function () {
          assert.isTrue(view.navigateAway.calledWith('/404'));
        });
      });

      describe('with a view that renders', function () {
        beforeEach(function () {
          sinon.stub(view, 'showChildView', () => p());
          sinon.spy(view, 'showRoute');

          return view.showRoute('route-that-renders', {});
        });

        it('delegates to `showChildView`', function () {
          assert.isTrue(view.getRouteDefinition.calledWith('route-that-renders'));
          assert.isTrue(view.showChildView.calledOnce);
        });
      });

      describe('with a view that errors', function () {
        let renderError = AuthErrors.toError('UNEXPECTED_ERROR');

        beforeEach(function () {
          sinon.stub(view, 'showChildView', () => p.reject(renderError));
          sinon.spy(view, 'showRoute');

          return view.showRoute('route-that-errors', {});
        });

        it('writes the error to the DOM', function () {
          assert.isTrue(view.getRouteDefinition.calledWith('route-that-errors'));
          assert.isTrue(view.showRoute.calledOnce);
          assert.isTrue(view.showChildView.calledOnce);
          assert.isTrue(view.fatalError.calledWith(renderError));
        });
      });

      describe('with a parentView', () => {
        let parentView;
        beforeEach(function () {
          sinon.stub(view, 'showChildView', (ParentView) => {
            parentView = new ParentView();
            sinon.stub(parentView, 'showChildView', (ChildView) => new ChildView());
            return p(parentView);
          });
          sinon.spy(view, 'showRoute');

          return view.showRoute('route-with-parent');
        });

        it('shows the parent, then the child', () => {
          assert.isTrue(view.getRouteDefinition.calledWith('route-with-parent'));
          assert.isTrue(view.getRouteDefinition.calledWith('route-that-renders'));
          assert.isTrue(view.showRoute.calledTwice);
          assert.isTrue(view.showChildView.calledOnce);
          assert.isTrue(view.showChildView.calledWith(View));
          assert.isTrue(parentView.showChildView.called);
          assert.isTrue(parentView.showChildView.calledWith(ChildView));
        });
      });
    });

    describe('showChildView', function () {
      let childView;

      const ChildView = Backbone.View.extend({
        afterVisible: sinon.spy(),
        destroy: sinon.spy(),
        displayStatusMessages: sinon.spy(),
        logView: sinon.spy(),
        render: sinon.spy(function () {
          return p(true);
        }),
        titleFromView () {
          return 'the second title';
        }
      });

      const SecondChildView = ChildView.extend({});

      beforeEach(function () {
        createDeps();

        sinon.spy(notifier, 'trigger');

        return view.showChildView(ChildView, {
          model: new Backbone.Model({ 'new-key': 'new-value' })
        })
        .then(function (_childView) {
          childView = _childView;
        });
      });

      it('creates & renders the child', () => {
        assert.equal(childView.model.get('new-key'), 'new-value');
        assert.isTrue(childView.afterVisible.calledOnce);
      });

      describe('with View that is already the child', () => {
        beforeEach(() => {
          return view.showChildView(ChildView, {
            model: new Backbone.Model({ 'child-key': 'child-value' })
          });
        });

        it('updates the currentView model with the sent data, notifies', () => {
          assert.equal(childView.model.get('child-key'), 'child-value');
          assert.isTrue(notifier.trigger.calledWith('navigate-from-child-view'));
        });
      });

      describe('with a different ChildView', () => {
        let originalChildView;

        beforeEach(() => {
          originalChildView = childView;
          return view.showChildView(SecondChildView, {
            model: new Backbone.Model({})
          });
        });

        it('destroys the previous child view', () => {
          assert.isTrue(originalChildView.destroy.calledOnce);
        });
      });
    });

    describe('onKeyUp', function () {

      before(function () {
        createDeps();
        sinon.spy(view, 'navigate');
      });

      it('press escape from settings view', function () {
        view.onKeyUp({ currentTarget: {className: 'settings'}, which: KeyCodes.ESCAPE });
        assert.isTrue(view.navigate.calledOnce);
        assert.isTrue(view.navigate.calledWith('settings'));
      });
    });
  });
});

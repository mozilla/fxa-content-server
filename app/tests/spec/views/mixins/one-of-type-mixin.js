/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { assert } from 'chai';
import BaseView from 'views/base';
import Cocktail from 'cocktail';
import OneOfTypeMixin from 'views/mixins/one-of-type-mixin';
import sinon from 'sinon';

class StringActionView extends BaseView {
  hide () {  }
  show () {  }
}

Cocktail.mixin(
  StringActionView,
  OneOfTypeMixin({
    action: 'hide',
    trigger: 'show',
    type: 'tooltip'
  })
);

class FunctionActionView extends BaseView {
  destroy () {  }
  show () {  }
}

Cocktail.mixin(
  FunctionActionView,
  OneOfTypeMixin({
    action () {
      this.destroy();
    },
    trigger: 'show',
    type: 'tooltip'
  })
);

describe('views/mixins/one-of-type-mixin', () => {
  it('trigger function will hide old ones', () => {
    const firstVisible = new StringActionView();
    const secondVisible = new FunctionActionView();

    sinon.spy(firstVisible, 'hide');
    sinon.spy(secondVisible, 'destroy');

    firstVisible.show();
    secondVisible.show();

    assert.isTrue(firstVisible.hide.calledOnce);
    assert.isFalse(secondVisible.destroy.called);

    firstVisible.show();

    assert.isTrue(firstVisible.hide.calledOnce);
    assert.isTrue(secondVisible.destroy.calledOnce);
  });
});

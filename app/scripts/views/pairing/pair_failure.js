/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import FormView from '../form';
import Template from '../../templates/pair_failure.mustache';

class PairFailureView extends FormView {
  template = Template;

  setInitialContext (context) {
    context.set('canTryAgain', true);
  }

  submit () {
    alert('hook this up to something');
  }
}

export default PairFailureView;

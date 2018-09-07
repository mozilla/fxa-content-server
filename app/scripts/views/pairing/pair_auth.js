/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import BaseView from '../base';
import promise from '../../lib/promise';
import QRCode from 'qrcode';
import Template from '../../templates/pair_auth.mustache';
import Url from '../../lib/url';

const createQRCode = promise.denodeify(QRCode.toDataURL);

class PairAuthView extends BaseView {
  template = Template;
  // mustAuth = true;

  beforeRender () {
    const account = this.getAccount();
    if (! account.has('sessionToken') || ! account.has('uid')) {
      this.relier.set('action', 'email');
      // TODO - figure out how to make this work with
      // email-first. redirectTo doesn't seem to work
      return this.navigate('signin', {
        redirectTo: this.currentPage
      });
    }

    this.listenTo(this.broker, 'change:channelId', this._updateQRCodeForChannel);
    this.listenTo(this.broker, 'change:salt', this._updateQRCodeForChannel);
    this.listenTo(this.broker, 'change:symmetricKey', this._updateQRCodeForChannel);
  }

  afterVisible () {
    if (! this.model.get('error')) {
      this.broker.start();
      this.listenTo(this.model, 'change', this.render);
    }

    return super.afterVisible();
  }

  getAccount () {
    return this.getSignedInAccount();
  }

  _updateQRCodeForChannel () {
    const { channelId, salt, symmetricKey } = this.broker.toJSON();
    const escapedUrl = this._getEscapedPairingUrl(channelId, symmetricKey, salt);
    return this._getQRCodeDataForUrl(escapedUrl)
      .then(qrcodeSrc => {
        this.model.set({
          escapedUrl,
          qrcodeSrc,
          symmetricKey,
        });
      });
  }

  _getQRCodeDataForUrl (url) {
    return createQRCode(url);
  }

  _getEscapedPairingUrl(channelId, symmetricKey, uid) {
    const hash = Url.objToUrlString({
      channelId,
      symmetricKey,
      uid,
    }, '#');

    return `${document.location.origin}/pair/supp${hash}`;
  }
}

export default PairAuthView;

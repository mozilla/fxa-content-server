/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This module sends front-end metrics to Amplitude
 */
'use strict';
const logger = require('./logging/log')('server.metrics-front-end');
const uaParser = require('node-uap');
const got = require('got');

function MetricsFrontEnd() {
  const config = require('./configuration');
  //const ampConfig = config.get('amplitude');

  //this.api_key = ampConfig.api_key;
}

MetricsFrontEnd.prototype = {
  /**
   * Initializes a StatsD socket client
   */
  init: function () {
  },

  /**
   * Send a formatted metrics object to StatsD
   *
   * @param {Object} body
   */
  write: function (body) {
    if (body) {
      const events = body.events;

      if (events && events.length > 0) {
        console.log(body);
        const ampEvents = [];

        events.filter(event => ! /^flow\./.test(event.type)).forEach((ev) => {
          // format: https://amplitude.zendesk.com/hc/en-us/articles/204771828
          const curEvent = {
            event_type: ev.type,
            time: body.startTime + ev.offset,
            user_id: body.uniqueUserId,
            language: body.lang,
            device_id: body.deviceId,
            user_properties: {
              utm_campaign: body.utm_campaign,
              utm_content: body.utm_content,
              utm_medium: body.utm_medium,
              utm_source: body.utm_source,
              entrypoint: body.entrypoint,
              service: body.service,
              context: body.context,
            }
          };

          if (body.agent) {
            const agent = uaParser.parse(body.agent);
            if (agent) {
              if (agent.os) {
                curEvent.os_name = agent.os.family; // -> "Safari"
                curEvent.os_version = agent.os.major; // -> "5"
              }

              if (agent.ua) {
                curEvent.user_properties.ua_name = agent.ua.family; // Safari
                curEvent.user_properties.ua_version = agent.ua.major; // 5
              }
            }
          }

          ampEvents.push(curEvent);
        });

        console.log('ampEvents', ampEvents);

        got.post('https://api.amplitude.com/httpapi', {
          body: {
            api_key: 'f98b3151b34335288ce9680d6a60fcea',
            event: JSON.stringify(ampEvents)
          }
        }).catch(error => {
          logger.warn(error);
        });

      }
    }
  },

};

module.exports = MetricsFrontEnd;

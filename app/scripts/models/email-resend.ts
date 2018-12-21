/**
 * Created by vijaybudhram on 4/28/17.
 */
import Backbone = require('../../bower_components/backbone/backbone');
import Constants = require('lib/Constants');

function shouldResend(tries: number, maxTries: number): boolean {
    return tries <= maxTries;
}

var EmailResend = Backbone.Model.extend({
    defaults: {
        tries: 0
    },

    initialize(opt): void  {
        opt = opt || {};
        this.maxTries = opt.maxTries || Constants.EMAIL_RESEND_MAX_TRIES;
    },

    incrementRequestCount(): void {
        var tries = this.get('tries') + 1;
        this.set('tries', tries);

        if (tries >= this.maxTries) {
            this.trigger('maxTriesReached');
        }
    },

    shouldResend(): boolean {
        return shouldResend(this.get('tries'), this.maxTries);
    },

    reset(): void {
        this.set('tries', 0);
    }
});

export = EmailResend;
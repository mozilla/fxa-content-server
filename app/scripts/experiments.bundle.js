/* eslint-disable */

!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.Able=t()}}(function(){return function t(e,n,r){function i(s,a){if(!n[s]){if(!e[s]){var u="function"==typeof require&&require;if(!a&&u)return u(s,!0);if(o)return o(s,!0);var c=new Error("Cannot find module '"+s+"'");throw c.code="MODULE_NOT_FOUND",c}var f=n[s]={exports:{}};e[s][0].call(f.exports,function(t){var n=e[s][1][t];return i(n?n:t)},f,f.exports,t,e,n,r)}return n[s].exports}for(var o="function"==typeof require&&require,s=0;s<r.length;s++)i(r[s]);return i}({1:[function(t,e,n){function r(t){i.call(this,t),this.reportUrl=t.reportUrl}var i=t("abatar"),o=t("inherits"),s=t("xhr");o(r,i),r.prototype.sendReport=function(t){s({method:"POST",url:this.reportUrl,json:this.report()},t)},e.exports=r},{abatar:5,inherits:8,xhr:9}],2:[function(t,e,n){function r(t){var e=t.experiments||[],n=t.enrolled||{};this.defaults=t.defaults||{},this.enrolled=new o,this.experiments=new o,this.localNow=t.localNow||Date.now(),this.remoteNow=t.remoteNow||this.localNow,this.subject=t.subject||{};for(var r=0;r<e.length;r++){var s=e[r];s.defaults=this.defaults,this.experiments.add(new i(s))}for(var a=Object.keys(n),r=0;r<a.length;r++){var u=a[r],s=n[u];this.enroll(this.experiments.get(s),u)}}var i=t("./experiment"),o=t("./experiment_index"),s=t("./util");r.Experiment=i,r.create=function(t){return new r(t)},r.prototype.now=function(){var t=this.remoteNow-this.localNow;return Date.now()+t},r.prototype.add=function(t){return this.experiments.add(t),this},r.prototype.enroll=function(t,e,n){return n=n||this.now(),"string"==typeof t&&(t=this.experiments.get(t)),t?(t.isLive(n)&&this.enrolled.add(t,t.key(e)),this):this},r.prototype.choose=function(t,e,n){n=n||this.now();var r=this.defaults[t],i=s.merge(this.subject,e),o=this.enrolled.getFirstMatch(t,i,n)||this.experiments.getFirstEligible(t,i,this.enrolled,n)||this.experiments.getReleased(t,n);if(o)try{r=o.choose(i,n)[t],this.enroll(o,i,n)}catch(a){}return r},r.prototype.mark=function(t,e,n){return this.enrolled.mark(t,e||{},s.merge(this.subject,n),this.now())},r.prototype.attributes=function(){return this.experiments.attributes()},r.prototype.variables=function(){return this.experiments.variables()},r.prototype.report=function(){return this.enrolled.report()},e.exports=r},{"./experiment":3,"./experiment_index":4,"./util":7}],3:[function(t,e,n){function r(t){this.release=o(t.release),this.active=!1,this.choices={},this.conclusion=t.conclusion,this.conflictsWith={},this.defaults=t.defaults,this.eligibilityFunction=t.eligibilityFunction||function(){return!1},this.endDate=this.release?this.release.endDate:Date.parse(t.endDate||c),this.groupingFunction=t.groupingFunction||function(){return{}},this.independentVariables=i(t.independentVariables),this.name=t.name,this.startDate=Date.parse(t.startDate||c),this.subjectAttributes=i(t.subjectAttributes),this.watch=t.watch||[],this.log=[]}function i(t){if(Array.isArray(t)){for(var e={},n=0;n<t.length;n++)e[t[0]]=!0;return e}return t||{}}function o(t){return t&&t.startDate&&t.endDate?{startDate:Date.parse(t.startDate),endDate:Date.parse(t.endDate)}:null}function s(t,e,n){var r=u.missingKeys(t,e);if(r)throw new Error(n+" : "+r.join())}var a=t("js-sha1"),u=t("./util"),c="3000-01-01";r.prototype.attributes=function(){return Object.keys(this.subjectAttributes)},r.prototype.isReleased=function(t){return t=t||Date.now(),this.endDate<t||this.release&&this.release.startDate<t},r.prototype.key=function(t){t=t||{};for(var e=this.attributes(),n=[this.name],r=0;r<e.length;r++)n.push(e[r]),n.push(t[e[r]]);return a(n.join(":"))},r.prototype.isLive=function(t){return t=t||Date.now(),t>=this.startDate&&t<=this.endDate},r.prototype.isWatching=function(t){return this.watch.indexOf(t)>-1},r.prototype.mark=function(t,e,n,r){var i=this.key(n),o={event:t,time:r||Date.now(),experiment:this.name,subjectId:i,choice:this.choices[i],data:e};return this.log.push(o),o},r.prototype.releaseProgress=function(t){t=t||Date.now();var e=this.release;return e?(t-e.startDate)/(e.endDate-e.startDate):0},r.prototype.setConflict=function(t){for(var e=0;e<t.length;e++){var n=t[e];this.conflictsWith[n.name]=!0,n.conflictsWith[this.name]=!0}},r.prototype.hash=function(t){return parseInt(a(this.name+":"+t).substring(27),16)},r.prototype.luckyNumber=function(t){return this.hash(t)/0xfffffffffffff},r.prototype.randomDouble=function(t,e,n){return e=e||0,n=0===n?0:n||1,e+(n-e)*this.luckyNumber(t)},r.prototype.randomInt=function(t,e,n){return e=e||0,n=0===n?0:n||1,e+this.hash(t)%(n-e+1)},r.prototype.bernoulliTrial=function(t,e){return this.luckyNumber(e)<=t},r.prototype.uniformChoice=function(t,e){return t[this.hash(e)%t.length]},r.prototype.isEligible=function(t,e){return this.isLive(e||Date.now())&&!u.missingKeys(this.subjectAttributes,t)&&this.eligibilityFunction(t)===!0},r.prototype.choose=function(t,e){e=e||Date.now();var n=null;return n=this.release?this.chooseRelease(t,e):e>this.endDate?this.conclusion:this.chooseGrouping(t),this.choices[this.key(t)]=n,this.mark("choice",{},t,e),n},r.prototype.chooseRelease=function(t,e){var n=this.luckyNumber(this.key(t));return n<=this.releaseProgress(e)?this.conclusion:this.chooseGrouping(t)},r.prototype.chooseGrouping=function(t){var e=this.groupingFunction(t);return s(this.independentVariables,e,"groupingFunction must return"),this.active=!0,e},r.prototype.report=function(){return this.log},r.prototype.truncate=function(){this.log=[]},r.prototype.definition=function(){var t={name:this.name,startDate:new Date(this.startDate).toISOString(),subjectAttributes:this.attributes(),independentVariables:Object.keys(this.independentVariables),conclusion:this.conclusion,eligibilityFunction:null,groupingFunction:null};this.release?t.release={startDate:new Date(this.release.startDate).toISOString(),endDate:new Date(this.release.endDate).toISOString()}:this.endDate!==Date.parse(c)&&(t.endDate=new Date(this.endDate).toISOString());var e=JSON.stringify(t);return e.replace(/"eligibilityFunction":null/,'"eligibilityFunction":'+this.eligibilityFunction.toString()).replace(/"groupingFunction":null/,'"groupingFunction":'+this.groupingFunction.toString())},e.exports=r},{"./util":7,"js-sha1":6}],4:[function(t,e,n){function r(){this.experimentsByName={},this.experimentsByVariable={},this.activeSubjectKeys={}}function i(t,e){var n=t.startDate-e.startDate;return 0!==n?n:t.hash()-e.hash()}function o(t,e){var n=t.endDate||t.release&&t.release.startDate||0,r=e.endDate||e.release&&e.release.startDate||0,i=n-r;return 0!==i?i:t.hash()-e.hash()}t("./util");r.prototype.filter=function(t){t=t||function(){return!0};for(var e=Object.keys(this.experimentsByName),n=[],r=0;r<e.length;r++){var i=this.experimentsByName[e[r]];t(i)&&n.push(i)}return n},r.prototype.attributes=function(){for(var t=this.filter(),e={},n=0;n<t.length;n++)for(var r=t[n],i=r.attributes(),o=0;o<i.length;o++)e[i[o]]=!0;return Object.keys(e)},r.prototype.variables=function(){return Object.keys(this.experimentsByVariable)},r.prototype.getByVariable=function(t){return this.experimentsByVariable[t]||[]},r.prototype.getLive=function(t,e){return this.getByVariable(t).filter(function(t){return t.isLive(e)})},r.prototype.getFirstMatch=function(t,e,n){var r=this;return this.getLive(t,n).filter(function(t){return r.activeSubjectKeys[t.key(e)]})[0]},r.prototype.getFirstLive=function(t,e){return this.getLive(t,e)[0]},r.prototype.getFirstEligible=function(t,e,n,i){function o(t){return!!n.get(t,e)}function s(t){return 0===Object.keys(t.conflictsWith).filter(o).length}e=e||{},n=n||new r;for(var a=this.getByVariable(t),u=0;u<a.length;u++){var c=a[u];try{if(s(c)&&c.isEligible(e,i))return c}catch(f){}}},r.prototype.getReleased=function(t,e){var n=this.getByVariable(t).filter(function(t){return t.isReleased(e)}).sort(o);return n[n.length-1]},r.prototype.get=function(t,e){var n=this.experimentsByName[t];if(!e||!n||this.activeSubjectKeys[n.key(e)])return n},r.prototype.add=function(t,e){if(!t||this.get(t.name))return this;for(var n=Object.keys(t.independentVariables),r=0;r<n.length;r++){var o=n[r],s=this.getByVariable(o);t.setConflict(s),s.push(t),s.sort(i),this.experimentsByVariable[o]=s}return this.experimentsByName[t.name]=t,e&&(this.activeSubjectKeys[e]=!0),this},r.prototype.active=function(){return this.filter(function(t){return t.active})},r.prototype.watching=function(t){return this.filter(function(e){return e.isWatching(t)})},r.prototype.mark=function(t,e,n,r){this.watching(t).map(function(i){return i.mark(t,e,n,r)})},r.prototype.report=function(){return this.active().reduce(function(t,e){return t.concat(e.report())},[])},r.prototype.names=function(){return this.filter().map(function(t){return t.name})},e.exports=r},{"./util":7}],5:[function(t,e,n){e.exports=t("./ab")},{"./ab":2}],6:[function(t,e,n){(function(t){!function(n,r){"use strict";var i="undefined"!=typeof e;i&&(n=t);var o="undefined"!=typeof Uint8Array,s="0123456789abcdef".split(""),a=[-2147483648,8388608,32768,128],u=[24,16,8,0],c=[];Array.prototype.__ARRAY__=!0,o&&(Uint8Array.prototype.__ARRAY__=!0);var f=function(t){var e,n,r,i,o,f,p,l,h,d,y=0,g=!1,b=0,v=0,m=0,w=t.length;e=1732584193,n=4023233417,r=2562383102,i=271733878,o=3285377520;do{if(c[0]=y,c[16]=c[1]=c[2]=c[3]=c[4]=c[5]=c[6]=c[7]=c[8]=c[9]=c[10]=c[11]=c[12]=c[13]=c[14]=c[15]=0,t.__ARRAY__)for(h=v;w>b&&64>h;++b)c[h>>2]|=t[b]<<u[3&h++];else for(h=v;w>b&&64>h;++b)f=t.charCodeAt(b),128>f?c[h>>2]|=f<<u[3&h++]:2048>f?(c[h>>2]|=(192|f>>6)<<u[3&h++],c[h>>2]|=(128|63&f)<<u[3&h++]):55296>f||f>=57344?(c[h>>2]|=(224|f>>12)<<u[3&h++],c[h>>2]|=(128|f>>6&63)<<u[3&h++],c[h>>2]|=(128|63&f)<<u[3&h++]):(f=65536+((1023&f)<<10|1023&t.charCodeAt(++b)),c[h>>2]|=(240|f>>18)<<u[3&h++],c[h>>2]|=(128|f>>12&63)<<u[3&h++],c[h>>2]|=(128|f>>6&63)<<u[3&h++],c[h>>2]|=(128|63&f)<<u[3&h++]);for(m+=h-v,v=h-64,b==w&&(c[h>>2]|=a[3&h],++b),y=c[16],b>w&&56>h&&(c[15]=m<<3,g=!0),d=16;80>d;++d)p=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=p<<1|p>>>31;var x=e,D=n,j=r,O=i,k=o;for(d=0;20>d;d+=5)l=D&j|~D&O,p=x<<5|x>>>27,k=p+l+k+1518500249+c[d]<<0,D=D<<30|D>>>2,l=x&D|~x&j,p=k<<5|k>>>27,O=p+l+O+1518500249+c[d+1]<<0,x=x<<30|x>>>2,l=k&x|~k&D,p=O<<5|O>>>27,j=p+l+j+1518500249+c[d+2]<<0,k=k<<30|k>>>2,l=O&k|~O&x,p=j<<5|j>>>27,D=p+l+D+1518500249+c[d+3]<<0,O=O<<30|O>>>2,l=j&O|~j&k,p=D<<5|D>>>27,x=p+l+x+1518500249+c[d+4]<<0,j=j<<30|j>>>2;for(;40>d;d+=5)l=D^j^O,p=x<<5|x>>>27,k=p+l+k+1859775393+c[d]<<0,D=D<<30|D>>>2,l=x^D^j,p=k<<5|k>>>27,O=p+l+O+1859775393+c[d+1]<<0,x=x<<30|x>>>2,l=k^x^D,p=O<<5|O>>>27,j=p+l+j+1859775393+c[d+2]<<0,k=k<<30|k>>>2,l=O^k^x,p=j<<5|j>>>27,D=p+l+D+1859775393+c[d+3]<<0,O=O<<30|O>>>2,l=j^O^k,p=D<<5|D>>>27,x=p+l+x+1859775393+c[d+4]<<0,j=j<<30|j>>>2;for(;60>d;d+=5)l=D&j|D&O|j&O,p=x<<5|x>>>27,k=p+l+k-1894007588+c[d]<<0,D=D<<30|D>>>2,l=x&D|x&j|D&j,p=k<<5|k>>>27,O=p+l+O-1894007588+c[d+1]<<0,x=x<<30|x>>>2,l=k&x|k&D|x&D,p=O<<5|O>>>27,j=p+l+j-1894007588+c[d+2]<<0,k=k<<30|k>>>2,l=O&k|O&x|k&x,p=j<<5|j>>>27,D=p+l+D-1894007588+c[d+3]<<0,O=O<<30|O>>>2,l=j&O|j&k|O&k,p=D<<5|D>>>27,x=p+l+x-1894007588+c[d+4]<<0,j=j<<30|j>>>2;for(;80>d;d+=5)l=D^j^O,p=x<<5|x>>>27,k=p+l+k-899497514+c[d]<<0,D=D<<30|D>>>2,l=x^D^j,p=k<<5|k>>>27,O=p+l+O-899497514+c[d+1]<<0,x=x<<30|x>>>2,l=k^x^D,p=O<<5|O>>>27,j=p+l+j-899497514+c[d+2]<<0,k=k<<30|k>>>2,l=O^k^x,p=j<<5|j>>>27,D=p+l+D-899497514+c[d+3]<<0,O=O<<30|O>>>2,l=j^O^k,p=D<<5|D>>>27,x=p+l+x-899497514+c[d+4]<<0,j=j<<30|j>>>2;e=e+x<<0,n=n+D<<0,r=r+j<<0,i=i+O<<0,o=o+k<<0}while(!g);return s[e>>28&15]+s[e>>24&15]+s[e>>20&15]+s[e>>16&15]+s[e>>12&15]+s[e>>8&15]+s[e>>4&15]+s[15&e]+s[n>>28&15]+s[n>>24&15]+s[n>>20&15]+s[n>>16&15]+s[n>>12&15]+s[n>>8&15]+s[n>>4&15]+s[15&n]+s[r>>28&15]+s[r>>24&15]+s[r>>20&15]+s[r>>16&15]+s[r>>12&15]+s[r>>8&15]+s[r>>4&15]+s[15&r]+s[i>>28&15]+s[i>>24&15]+s[i>>20&15]+s[i>>16&15]+s[i>>12&15]+s[i>>8&15]+s[i>>4&15]+s[15&i]+s[o>>28&15]+s[o>>24&15]+s[o>>20&15]+s[o>>16&15]+s[o>>12&15]+s[o>>8&15]+s[o>>4&15]+s[15&o]};n.JS_SHA1_TEST||"undefined"==typeof e?n&&(n.sha1=f):e.exports=f}(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],7:[function(t,e,n){function r(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])}function i(t,e){var n={};return r(n,t),r(n,e),n}function o(t,e){var n=Object.keys(t);if("object"!=typeof e)return n;for(var r=null,i=0;i<n.length;i++){var o=n[i];e.hasOwnProperty(o)||(r=r||[],r.push(o))}return r}e.exports={overwrite:r,merge:i,missingKeys:o}},{}],8:[function(t,e,n){"function"==typeof Object.create?e.exports=function(t,e){t.super_=e,t.prototype=Object.create(e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}})}:e.exports=function(t,e){t.super_=e;var n=function(){};n.prototype=e.prototype,t.prototype=new n,t.prototype.constructor=t}},{}],9:[function(t,e,n){"use strict";function r(t,e){function n(){4===p.readyState&&o()}function r(){var t=void 0;if(p.response?t=p.response:"text"!==p.responseType&&p.responseType||(t=p.responseText||p.responseXML),m)try{t=JSON.parse(t)}catch(e){}return t}function i(t){clearTimeout(h),t instanceof Error||(t=new Error(""+(t||"unknown"))),t.statusCode=0,e(t,f)}function o(){clearTimeout(h);var t=1223===p.status?204:p.status,n=f,i=null;0!==t?(n={body:r(),statusCode:t,method:y,headers:{},url:d,rawRequest:p},p.getAllResponseHeaders&&(n.headers=a(p.getAllResponseHeaders()))):i=new Error("Internal XMLHttpRequest Error"),e(i,n,n.body)}var f={body:void 0,headers:{},statusCode:0,method:y,url:d,rawRequest:p};if("string"==typeof t&&(t={uri:t}),t=t||{},"undefined"==typeof e)throw new Error("callback argument missing");e=s(e);var p=t.xhr||null;p||(p=t.cors||t.useXDR?new c:new u);var l,h,d=p.url=t.uri||t.url,y=p.method=t.method||"GET",g=t.body||t.data,b=p.headers=t.headers||{},v=!!t.sync,m=!1;if("json"in t&&(m=!0,b.Accept||(b.Accept="application/json"),"GET"!==y&&"HEAD"!==y&&(b["Content-Type"]="application/json",g=JSON.stringify(t.json))),p.onreadystatechange=n,p.onload=o,p.onerror=i,p.onprogress=function(){},p.ontimeout=i,p.open(y,d,!v),p.withCredentials=!!t.withCredentials,!v&&t.timeout>0&&(h=setTimeout(function(){p.abort("timeout")},t.timeout+2)),p.setRequestHeader)for(l in b)b.hasOwnProperty(l)&&p.setRequestHeader(l,b[l]);else if(t.headers)throw new Error("Headers cannot be set on an XDomainRequest object");return"responseType"in t&&(p.responseType=t.responseType),"beforeSend"in t&&"function"==typeof t.beforeSend&&t.beforeSend(p),p.send(g),p}function i(){}var o=t("global/window"),s=t("once"),a=t("parse-headers"),u=o.XMLHttpRequest||i,c="withCredentials"in new u?u:o.XDomainRequest;e.exports=r},{"global/window":10,once:11,"parse-headers":15}],10:[function(t,e,n){(function(t){var n;n="undefined"!=typeof window?window:"undefined"!=typeof t?t:"undefined"!=typeof self?self:{},e.exports=n}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],11:[function(t,e,n){function r(t){var e=!1;return function(){return e?void 0:(e=!0,t.apply(this,arguments))}}e.exports=r,r.proto=r(function(){Object.defineProperty(Function.prototype,"once",{value:function(){return r(this)},configurable:!0})})},{}],12:[function(t,e,n){function r(t,e,n){if(!a(e))throw new TypeError("iterator must be a function");arguments.length<3&&(n=this),"[object Array]"===u.call(t)?i(t,e,n):"string"==typeof t?o(t,e,n):s(t,e,n)}function i(t,e,n){for(var r=0,i=t.length;i>r;r++)c.call(t,r)&&e.call(n,t[r],r,t)}function o(t,e,n){for(var r=0,i=t.length;i>r;r++)e.call(n,t.charAt(r),r,t)}function s(t,e,n){for(var r in t)c.call(t,r)&&e.call(n,t[r],r,t)}var a=t("is-function");e.exports=r;var u=Object.prototype.toString,c=Object.prototype.hasOwnProperty},{"is-function":13}],13:[function(t,e,n){function r(t){var e=i.call(t);return"[object Function]"===e||"function"==typeof t&&"[object RegExp]"!==e||"undefined"!=typeof window&&(t===window.setTimeout||t===window.alert||t===window.confirm||t===window.prompt)}e.exports=r;var i=Object.prototype.toString},{}],14:[function(t,e,n){function r(t){return t.replace(/^\s*|\s*$/g,"")}n=e.exports=r,n.left=function(t){return t.replace(/^\s*/,"")},n.right=function(t){return t.replace(/\s*$/,"")}},{}],15:[function(t,e,n){var r=t("trim"),i=t("for-each"),o=function(t){return"[object Array]"===Object.prototype.toString.call(t)};e.exports=function(t){if(!t)return{};var e={};return i(r(t).split("\n"),function(t){var n=t.indexOf(":"),i=r(t.slice(0,n)).toLowerCase(),s=r(t.slice(n+1));"undefined"==typeof e[i]?e[i]=s:o(e[i])?e[i].push(s):e[i]=[e[i],s]}),e}},{"for-each":12,trim:14}]},{},[1])(1)});var able = new Able({remoteNow:1499703184034,defaults:{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},subject:undefined,experiments:[{"name":"Is the avatar link visible","startDate":"2015-01-01","endDate":"2015-08-12","subjectAttributes":["email"],"independentVariables":["avatarLinkVisible"],"conclusion":{"avatarLinkVisible":true},"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    return true;
  },"groupingFunction":function (subject) {
    return {
      avatarLinkVisible: /@mozilla\.(?:com|org)$/.test(subject.email)
    };
  }},{"name":"Is the apps list settings section visible","startDate":"2015-01-01","subjectAttributes":["forceAppsList"],"independentVariables":["appsListVisible"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    if (subject && subject.forceAppsList) {
      return true;
    }

    return false;
  },"groupingFunction":function (subject) {
    return {
      appsListVisible: true
    };
  }},{"name":"Is the devices list settings section visible","startDate":"2015-01-01","subjectAttributes":["forceDeviceList","uid"],"independentVariables":["deviceListVisible"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    var sampleRate = 1;

    if (subject) {
      if (subject.forceDeviceList) {
        return true;
      }

      if (subject.uid) {
        return !! (this.bernoulliTrial(sampleRate, subject.uid));
      }
    }

    return false;
  },"groupingFunction":function (subject) {
    return {
      deviceListVisible: true
    };
  }},{"name":"Are the sessions listed in the devices and apps view","startDate":"2015-01-01","subjectAttributes":["firefoxVersion"],"independentVariables":["sessionsListVisible"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    var FIREFOX_VERSION = 53;

    if (subject && subject.firefoxVersion >= FIREFOX_VERSION) {
      return true;
    }

    return false;
  },"groupingFunction":function (subject) {
    return {
      sessionsListVisible: true
    };
  }},{"name":"Are the communication preferences enabled","startDate":"2015-01-01","subjectAttributes":["lang"],"independentVariables":["communicationPrefsVisible"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    return !! (subject && subject.lang);
  },"groupingFunction":function (subject) {
    var AVAILABLE_LANGUAGES = [
      'de',
      'en',
      'en-[a-z]{2}',
      'es',
      'es-[a-z]{2}',
      'fr',
      'hu',
      'id',
      'pl',
      'pt-br',
      'ru',
      'zh-TW'
    ];

    // double quotes are used instead of single quotes to avoid an
    // "unterminated string literal" error
    var availableLocalesRegExpStr = "^(" + AVAILABLE_LANGUAGES.join("|") + ")$"; //eslint-disable-line quotes
    var availableLocalesRegExp = new RegExp(availableLocalesRegExpStr);

    function normalizeLanguage(lang) {
      return lang.toLowerCase().replace(/_/g, '-');
    }

    function areCommunicationPrefsAvailable(lang) {
      var normalizedLanguage = normalizeLanguage(lang);
      return availableLocalesRegExp.test(normalizedLanguage);
    }

    return {
      communicationPrefsVisible: areCommunicationPrefsAvailable(subject.lang)
    };
  }},{"name":"Should the user see the \"connect another device\" screen","hypothesis":"A nudge to connect another device will help increase multi-device users","startDate":"2015-01-01","subjectAttributes":[],"independentVariables":["connectAnotherDevice"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    return true;
  },"groupingFunction":function (subject) {
    return {
      connectAnotherDevice: 'treatment'
    };
  }},{"name":"enables JavaScript Sentry error metrics","startDate":"2015-01-01","subjectAttributes":["uniqueUserId","env"],"independentVariables":["sentryEnabled"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    var sampleRate = subject.env === 'development' ? 1.0 : 0.3;

    return !! (subject.env && subject.uniqueUserId && this.bernoulliTrial(sampleRate, subject.uniqueUserId));
  },"groupingFunction":function () {
    return {
      sentryEnabled: true
    };
  }},{"name":"determine whether the user is sampled by the internal metrics infrastructure","startDate":"2015-01-01","subjectAttributes":["uniqueUserId","env"],"independentVariables":["isSampledUser"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    var sampleRate = subject.env === 'development' ? 1.0 : 0.1;

    return !! (subject.env && subject.uniqueUserId && this.bernoulliTrial(sampleRate, subject.uniqueUserId));
  },"groupingFunction":function () {
    return {
      isSampledUser: true
    };
  }},{"name":"the password strength checker is enabled","hypothesis":"the password strength checker will prevent users from signing up with insecure passwords.","startDate":"2015-01-01","subjectAttributes":["uniqueUserId","isMetricsEnabledValue","forcePasswordStrengthCheck"],"independentVariables":["passwordStrengthCheckEnabled"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    if (subject) {
      if (subject.forcePasswordStrengthCheck === 'true') {
        return true;
      }

      if (subject.forcePasswordStrengthCheck === 'false') {
        return false;
      }

      if (subject.isMetricsEnabledValue) {
        return true;
      }
    }

    return false;
  },"groupingFunction":function (subject) {
    return {
      passwordStrengthCheckEnabled: true
    };
  }},{"name":"Should `Send SMS` be enabled for the given country?","hypothesis":"Allow more countries!","startDate":"2017-01-01","subjectAttributes":["account","country"],"independentVariables":["sendSmsEnabledForCountry"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    if (! subject || ! subject.account || ! subject.country) {
      return false;
    }

    function canEmailSendToRo (email) {
      return /@softvision\.(com|ro)$/.test(email) ||
             /@mozilla\.(com|org)$/.test(email);
    }

    var sendSmsEnabledForCountry = /^(CA|GB|RO|US)$/.test(subject.country);
    if (subject.country === 'RO') {
      // only Softvision and Mozilla emails
      // are allowed to send SMS to Romania.
      sendSmsEnabledForCountry = canEmailSendToRo(subject.account.get('email'));
    }

    return sendSmsEnabledForCountry;
  },"groupingFunction":function () {
    return {
      sendSmsEnabledForCountry: true
    };
  }},{"name":"Should the user see the \"Send install link via SMS\" screen","hypothesis":"Allowing users to send a Firefox Mobile link via SMS will result in a better conversion rate","startDate":"2017-01-01","subjectAttributes":["account","forceExperimentGroup","uniqueUserId"],"independentVariables":["sendSms"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    if (! subject || ! subject.account || ! subject.uniqueUserId) {
      return false;
    }

    // Everyone is in this experiment.
    return true;
  },"groupingFunction":function (subject) {
    function isEmailInTreatment (email) {
      return /@softvision\.(com|ro)$/.test(email) ||
             /@mozilla\.(com|org)$/.test(email);
    }

    var GROUPS = ['control', 'treatment'];
    var choice = this.uniformChoice(GROUPS, subject.uniqueUserId);

    if (subject.forceExperimentGroup) {
      choice = subject.forceExperimentGroup;
    } else if (isEmailInTreatment(subject.account.get('email'))) {
      choice = 'treatment';
    }

    return {
      sendSms: choice
    };
  }},{"name":"Has spring campaign 2015 begun","endDate":"2015-06-02","independentVariables":["springCampaign2015"],"conclusion":{"springCampaign2015":true},"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function () {},"groupingFunction":function () {}},{"name":"verification ab experiment chooser","hypothesis":"keeps verification experiments independent","startDate":"2015-01-01","subjectAttributes":["uniqueUserId","isMetricsEnabledValue","forceExperiment"],"independentVariables":["chooseAbExperiment"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    if (subject) {
      if (subject.forceExperiment) {
        return true;
      }

      if (subject.isMetricsEnabledValue) {
        // a random sampling of 50% of sessions (of 10% of sampled user base) will be in the verification experiments
        return this.bernoulliTrial(0.5, subject.uniqueUserId);
      }
    }

    return false;
  },"groupingFunction":function (subject) {
    var EXPERIMENT_CHOICES = ['mailcheck'];
    var choice = this.uniformChoice(EXPERIMENT_CHOICES, subject.uniqueUserId);

    if (subject.forceExperiment) {
      choice = subject.forceExperiment;
    }

    return {
      chooseAbExperiment: choice
    };
  }},{"name":"mailcheck is enable or disabled","hypothesis":"mailcheck will lead to higher confirmation rate of accounts","startDate":"2015-01-01","subjectAttributes":["able","uniqueUserId","isMetricsEnabledValue","forceExperiment","forceExperimentGroup"],"independentVariables":["mailcheck"],"defaults":{"appsListVisible":false,"avatarLinkVisible":false,"communicationPrefsVisible":false,"connectAnotherDevice":false,"coppaView":false,"deviceListVisible":false,"isSampledUser":false,"mailcheck":false,"openGmail":false,"passwordStrengthCheckEnabled":false,"sendSms":false,"sendSmsEnabledForCountry":false,"sentryEnabled":false,"sessionsListVisible":false,"springCampaign2015":false,"syncCheckbox":false,"chooseAbExperiment":false},"eligibilityFunction":function (subject) {
    if (subject && subject.able) {
      return subject.able.choose('chooseAbExperiment', subject) === 'mailcheck';
    }
    return false;
  },"groupingFunction":function (subject) {
    var GROUPS = ['control', 'treatment'];
    var choice = this.uniformChoice(GROUPS, subject.uniqueUserId);

    if (subject.forceExperimentGroup) {
      choice = subject.forceExperimentGroup;
    }

    return {
      mailcheck: choice
    };
  }}],reportUrl:"/able/report"});
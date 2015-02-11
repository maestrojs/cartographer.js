var factory = function() {
    /*
     TrafficCop
     Author: Jim Cowart
     License: Dual licensed MIT (http://www.opensource.org/licenses/mit-license) & GPL (http://www.opensource.org/licenses/gpl-license)
     Version 0.3.0
     */

    var inProgress = {};
    $ = window.$ || arguments[0];
    $.trafficCop = function(url, options) {
        var reqOptions = url, key;
        if(arguments.length === 2) {
            reqOptions = $.extend(true, options, { url: url });
        }
        key = JSON.stringify(reqOptions);
        if (key in inProgress) {
            for (i in {success: 1, error: 1, complete: 1}) {
                inProgress[key][i](reqOptions[i]);
            }
        } else {
            inProgress[key] = $.ajax(reqOptions).always(function () { delete inProgress[key]; });
        }
        return inProgress[key];
    };

    return $.trafficCop;
};

if( window.define ) {
    define(['jquery'], function($) {
      factory($);
    });
} else {
    factory();
}
/**
 * Created by JetBrains WebStorm.
 * User: alex
 * Date: 2/22/12
 * Time: 2:41 PM
 * To change this template use File | Settings | File Templates.
 */

require.config({
    paths: {
        'require':          '../ext/requirejs-1.0.5',
        'require-text':     '../ext/requirejs-text-1.0.2',
        'jquery':           '../ext/jquery-1.7.1',
        'underscore':       '../ext/underscore-1.3.1',
        'trafficcop':       '../ext/trafficCop-0.3.0',
        'infuser':          '../ext/infuser-0.2.0',
        'postal':           '../ext/postal-0.4.0',
        'postal.diagnostics': '../ext/postal.diagnostics',
        'arbiter':          '../ext/arbiter-0.1.0',
        'cartographer':     '../lib/cartographer'
    }
});


require(
    [
        'require',
        'require-text',
        'jquery',
        'underscore',
        'postal',
        'postal.diagnostics',
        'infuser',
        'cartographer'
    ],
    function(require, requireText, $, _, postal, diagnostics, infuser, cartographer){

        console.log("dis here's bout to get ZOPPITY!!!!");

        window.postal = postal;

        require(['app'], function(app){

        });

    });
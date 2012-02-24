require.config({
    paths: {
        'require': '../ext/requirejs-1.0.5',
        'require-text': '../ext/requirejs-text-1.0.2',
        'jQuery': '../ext/jquery-1.7.1',
        'DOMBuilder': '../ext/DOMBuilder.min',
        'underscore': '../ext/underscore-1.3.1',
        'trafficcop': '../ext/trafficCop-0.3.0',
        'infuser': '../ext/infuser-0.2.0',
        'postal': '../ext/postal-0.4.0',
        'postal.diagnostics': '../ext/postal.diagnostics',
        'arbiter': '../ext/arbiter-0.1.0',
        'cartographer': '../lib/cartographer'
    }
});

require([
    'require',
    'jQuery',
    'infuser',
    'cartographer'
    ],
    function(require, $, infuser, cartographer) {
        window.jQuery = $;
        window.infuser = infuser;
        window.cartographer = cartographer;
    });
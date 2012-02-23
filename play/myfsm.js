define([
    'postal',
    'arbiter',
    'cartographer'
    ], function( postal, arbiter ){

    var fsm = new arbiter.Fsm({

        initialState: "initial",
        events: [],
        states: {
            "initial": {
                "myButton.click": function( state, payload ) {
                    alert("HAY A CLICKITY-CLACKITY! :@ :@ :@");
                }
            }
        },
        messaging: {
            provider: "custom",
            subscriptions: []
        }
    });

    console.log("arbiter built fsm");

    return fsm;

});
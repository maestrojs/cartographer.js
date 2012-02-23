define(['jquery', 'underscore'], function($, _) {
    /*
     Arbiter.js
     Author: Jim Cowart
     License: Dual licensed MIT (http://www.opensource.org/licenses/mit-license) & GPL (http://www.opensource.org/licenses/gpl-license)
     Version 0.1.0
     */

    if(!_.deepExtend) {
        var behavior = {
            "*" : function(obj, sourcePropKey, sourcePropVal) {
                obj[sourcePropKey] = sourcePropVal;
            },
            "object": function(obj, sourcePropKey, sourcePropVal) {
                obj[sourcePropKey] = deepExtend({}, sourcePropVal);
            },
            "array": function(obj, sourcePropKey, sourcePropVal) {
                obj[sourcePropKey] = [];
                _.each(sourcePropVal, function(item, idx) {
                    behavior[getHandlerName(item)](obj[sourcePropKey], idx, item);
                }, this);
            }
        },
            getActualType = function(val) {
                if(_.isArray(val))  { return "array"; }
                if(_.isDate(val))   { return "date";  }
                if(_.isRegExp(val)) { return "regex"; }
                return typeof val;
            },
            getHandlerName = function(val) {
                var propType = getActualType(val);
                return behavior[propType] ? propType : "*";
            },
            deepExtend = function(obj) {
                _.each(slice.call(arguments, 1), function(source) {
                    _.each(source, function(sourcePropVal, sourcePropKey) {
                        behavior[getHandlerName(sourcePropVal)](obj, sourcePropKey, sourcePropVal);
                    });
                });
                return obj;
            };

        _.mixin({
            deepExtend : deepExtend
        });
    }
    var slice = [].slice,
        transformEventListToObject = function(eventList){
            var obj = {};
            _.each(eventList, function(evntName) {
                obj[evntName] = [];
            });
            return obj;
        },
        parseEvents = function(evnts) {
            var obj = evnts;
            if(_.isArray(evnts)) {
                obj = transformEventListToObject(evnts);
            }
            return obj;
        };
    var utils = {
        getExchBase: function(fsm) {
            return fsm.messaging.exchange || "";
        },
        getTopicBase: function(fsm) {
            return fsm.messaging.topic || "";
        },
        getHandlerNames: function(fsm) {
            return _.uniq(
                _.flatten(
                    _.map(fsm.states, function(st) {
                        return _.keys(st);
                    })
                )
            );
        },
        findProvider: function() {
            return window.postal ? "postal" : window.amplify ? "amplify" : undefined;
        },
        makeArbiterTopic: (function(){
            var arbiterCount = 0;
            return function() {
                return "fsm." + arbiterCount++;
            }
        })(),
        getDefaultOptions: function() {
            return {
                initialState: "uninitialized",
                events: {
                    "NoHandler"     : [],
                    "Transitioned"  : [],
                    "Handling"      : [],
                    "Handled"       : [],
                    "InvalidState"  : []
                },
                states: {},
                stateBag: {},
                messaging: {
                    provider : utils.findProvider(),
                    exchange: "arbiter",
                    topic: utils.makeArbiterTopic(),
                    subscriptions: [],
                    publishers: []
                }
            };
        },
        standardEventTransforms: {
            "Handling" : function(payload) {
                payload.eventType = payload[1];
                delete payload[1];
                return payload;
            },
            "Handled" : function(payload) {
                payload.eventType = payload[1];
                delete payload[1];
                return payload;
            },
            "Transitioned" : function(payload) {
                payload.oldState = payload[1];
                payload.newState = payload[2];
                delete payload[1];
                delete payload[2];
                return payload;
            },
            "InvalidState": function(payload) {
                payload.currentState = payload[1];
                payload.attemptedState = payload[2];
                delete payload[1];
                delete payload[2];
                return payload;
            },
            NoHandler: function(payload) {
                payload.eventType = payload[1];
                delete payload[1];
                return payload;
            }
        }
    };
// Provide integration points with a pubsub
    var messageBusProvider = { };
    var PostalFsmProvider = function() {
        var eventTransformations = {},
            wireHandlersToBus = function(exch, ns, fsm) {
                fsm.messaging.subscriptions.push(
                    postal.subscribe(exch, ns + ".handle.*", function(data, envelope){
                        this.handle.call(this, envelope.topic, data);
                    }).withContext(fsm)
                );
            },
            wireEventsToBus = function(exch, ns, fsm) {
                var evnt = ns + ".event.";
                _.each(fsm.events, function(value, key) {
                    var pub = function() {
                        var payload = _.deepExtend({}, arguments);
                        payload.stateBag = payload[0];
                        delete payload[0];
                        if(eventTransformations[key]) {
                            payload = eventTransformations[key](payload);
                        }
                        postal.publish(exch, evnt + key, payload);
                    };
                    value.push(pub);
                    fsm.messaging.publishers.push( { "Event" : key, "publish" : pub } );
                });
            };
        return {
            wireUp: function(fsm) {
                var exch = utils.getExchBase(fsm),
                    ns = utils.getTopicBase(fsm),
                    evnt = ns + "event.";
                if(!exch) { exch = "/"; }
                wireHandlersToBus(exch, ns, fsm);
                wireEventsToBus(exch, ns, fsm);
            },
            addEventTransforms: function(transforms) {
                _.deepExtend(eventTransformations, transforms);
            }
        };
    };
    messageBusProvider.postal = new PostalFsmProvider();
    messageBusProvider.postal.addEventTransforms(utils.standardEventTransforms);
    var AmplifyFsmProvider = function() {
        var eventTransformations = {},
            wireHandlersToBus = function(exch, ns, fsm) {
                _.each(utils.getHandlerNames(fsm), function(topic) {
                    fsm.messaging.subscriptions.push(
                        amplify.subscribe(exch + "." + ns + "." + topic, fsm, function(data) {
                            this.handle.call(this,topic, data);
                        })
                    );
                });
            },
            wireEventsToBus = function(exch, ns, fsm) {
                var evnt = ns + "event.";
                _.each(fsm.events, function(value, key) {
                    var pub = function() {
                        var payload = _.deepExtend({}, arguments);
                        payload.stateBag = payload[0];
                        delete payload[0];
                        if(eventTransformations[key]) {
                            payload = eventTransformations[key](payload);
                        }
                        amplify.publish(exch + "." + evnt + key, payload);
                    };
                    value.push(pub);
                    fsm.messaging.publishers.push( { "Event" : key, "publish" : pub } );
                });
            };
        return {
            wireUp: function(fsm) {
                var exch = utils.getExchBase(fsm),
                    ns = utils.getTopicBase(fsm),
                    evnt = ns + "event.";
                wireHandlersToBus(exch, ns, fsm);
                wireEventsToBus(exch, ns, fsm);
            },
            addEventTransforms: function(transforms) {
                _.deepExtend(eventTransformations, transforms);
            }
        };
    };
    messageBusProvider.amplify = new AmplifyFsmProvider();
    messageBusProvider.amplify.addEventTransforms(utils.standardEventTransforms);
    var Fsm = function(options) {
        var opt, initialState;
        if(options && options.events) {
            options.events = parseEvents(options.events);
        }
        opt = _.deepExtend({ stateBag: { _priorAction:"", _currentAction: "" }}, utils.getDefaultOptions(), options || {});
        initialState = opt.initialState;
        delete opt.initialState;
        _.extend(this,opt);

        if(this.messaging.provider && messageBusProvider[this.messaging.provider]) {
            messageBusProvider[this.messaging.provider].wireUp(this);
        }

        this.state = undefined;
        if(initialState) {
            this.transition(initialState);
        }
    };

    Fsm.prototype.fireEvent = function(eventName) {
        var i = 0, len, args = arguments;
        if(this.events[eventName]) {
            _.each(this.events[eventName], function(callback) {
                callback.apply(this,slice.call(args, 1));
            });
        }
    };

    Fsm.prototype.handle = function(msgType) {
        // vars to avoid a "this." fest
        var states = this.states, current = this.state, stateBag = this.stateBag, args = slice.call(arguments,0), handlerName;
        if(states[current] && (states[current][msgType] || states[current]["*"])) {
            handlerName = states[current][msgType] ? msgType : "*";
            stateBag._currentAction = current + "." + handlerName;
            this.fireEvent.apply(this, ["Handling", stateBag ].concat(args));
            states[current][handlerName].apply(this, [stateBag].concat(args.slice(1)));
            this.fireEvent.apply(this, ["Handled", stateBag ].concat(args));
            stateBag._priorAction = stateBag._currentAction;
            stateBag._currentAction = "";
        }
        else {
            this.fireEvent.apply(this, ["NoHandler", stateBag ].concat(args));
        }
    };

    Fsm.prototype.transition = function(newState) {
        if(this.states[newState]){
            var oldState = this.state;
            this.state = newState;
            if(this.states[newState]._onEnter) {
                this.states[newState]._onEnter.call( this, this.stateBag );
            }
            this.fireEvent.apply(this, ["Transitioned", this.stateBag, oldState, this.state ]);
            return;
        }
        this.fireEvent.apply(this, ["InvalidState", this.stateBag, this.state, newState ]);
    };

    Fsm.prototype.on = function(eventName, callback) {
        if(this.events[eventName]) {
            this.events[eventName].push(callback);
            return;
        }
        throw new Error("Invalid Event Name '" + eventName + "'.");
    };

    Fsm.prototype.off = function(eventName, callback) {
        if(this.events[eventName]){
            _.without(this.events[eventName], callback);
        }
        throw new Error("Invalid Event Name '" + eventName + "'.");
    };


    var arbiter = {
        Fsm: Fsm,
        busProviders: messageBusProvider,
        utils: utils
    };
    return arbiter;});
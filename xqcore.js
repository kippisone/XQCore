/*!
 * XQCore - +0.11.1-29
 * 
 * Model View Presenter Javascript Framework
 *
 * XQCore is licenced under MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Copyright (c) 2012 - 2015 Noname Media, http://noname-media.com
 * Author Andi Heinkelein
 *
 * Creation Date: 2015-04-06
 */

/*global XQCore:true */
var XQCore;

(function (root, factory) {
    /*global define:false */
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define('xqcore', ['jquery'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        root.XQCore = factory(root.jQuery);
    }
}(this, function (jQuery) {
    'use strict';

    /**
     * XQCore main object
     *
     * @package XQcore
     * @module  XQCore
     * @type {Object}
     */
    XQCore = {
        /**
         * Contains the current XQCore version
         * @property {String} version
         */
        version: '0.11.1-29',
        
        /**
         * Defines a default route
         * @property {String} defaultRoute
         */
        defaultRoute: 'index',

        /**
         * Enables html5 routing support
         * @property {Boolean} html5Routes
         * @default false
         */
        html5Routes: false,

        /**
         * Sets a hashbang for routing. This value is added to each route if html5Routes is set to false
         * @property {String} hashBang
         */
        hashBang: '#!',

        //TODO Check whether we need this property
        callerEvent: 'callerEvent',

        //TODO Do we need this?
        objectIdPattern: /^[a-zA-Z0-9]{24}$/,

        /**
         * Sets the default template engine
         * @property {String} templateEngine
         * @default firetpl
         */
        templateEngine: 'firetpl',

        /**
         * Sets a views directory
         * @property {String} viewsDir
         */
        viewsDir: './views/',

        /**
         * Set the file extension for views
         * @property {String} viewExt
         */
        viewExt: '.fire',

        /**
         * Defines a default socket port
         * @property {Number} socketPort
         * @default 9889
         */
        socketPort: 9889
    };

    
    /**
     * Merges the properties from one or more objects together into a target object
     * Its simply an alias for jQuery.extend. Use this method for frontend/backend shared modules.
     * 
     * @method extend
     * @param {Boolean} [deep] If true, a deep merge is using
     * @param {Object} target Target object. This object will be extended with new properties
     * @param {Object} [object1] Object to merge
     * @param {Object} [objectN] Object to merge
     * @return {Object} Returns the merged target object
     * @example {js}
     * var target = {
     *     a: 'A1',
     *     b: 'B1'
     * }
     *
     * var obj1 = {
     *     b: 'B2',
     *     c: 'C2'
     * }
     *
     * extend(target, obj1);
     * //Returns {a: 'A1', b: 'B2', c: 'C2'}
     *  
     */
    XQCore.extend = jQuery.extend;


    XQCore.isEmptyObject = jQuery.isEmptyObject;
    XQCore.isPlainObject = jQuery.isPlainObject;
    XQCore.isFunction = jQuery.isFunction;

    /**
     * Module storage
     */
    XQCore.__moduleCache = {};
    
    /**
     * Checks for a valid ObjectId
     * 
     * The pattern of an objectId can be overwritten by setting the XQCore.objectIdPattern property
     *
     * @return {Boolean} Returns true if value is an valid objectId
     */
    XQCore.isObjectId = function(value) {
        return this.objectIdPattern.test(value);
    };

    /**
     * Defines module names for different module loading mechanisms
     * @type {Object}
     */
    XQCore.modules = {
        jquery: {
            cjs: 'jquery',
            amd: 'jquery',
            win: 'jQuery',
        },
        firetpl: {
            cjs: 'firetpl',
            amd: 'firetpl',
            win: 'fireTpl',
        },
        sockjs: {
            cjs: 'xqcore/lib/sockjs.js',
            amd: 'xqcore/lib/sockjs.js',
            win: 'SockJS',
        }
    };

    
    /**
     * Import a mudule name, uses current used module load or load from window
     * @param  {String} moduleName Module name
     * @return {Any}            Returns the module
     */
    XQCore.require = function(moduleName) {
        if (XQCore.__moduleCache[moduleName]) {
            return XQCore.__moduleCache[moduleName];
        }

        var loadMechanism = 'win';
        if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
            loadMechanism = 'cjs';
        }
        else if (typeof define === 'function' && define.amd) {
            loadMechanism = 'amd';
        }

        if (XQCore.modules[moduleName][loadMechanism]) {
            moduleName = XQCore.modules[moduleName][loadMechanism];
        }

        try {
            if (loadMechanism === 'cjs' || loadMechanism === 'amd') {
                try {
                    return require(moduleName);
                }
                catch (err) {
                    console.warn('Module not registered as a ' + (loadMechanism === 'cjs' ? 'CommonJS' : 'AMD') + ' module! Try to load from window object', moduleName);
                }
            }
            
            return window[moduleName];
        }
        catch(err) {
            console.error('Could not load module!', moduleName, err);
        }
    };

    /**
     * Set a local for the current session
     * 
     * @method setLocale
     * @param  {String}  locale Local string
     */
    XQCore.setLocale = function(locale) {
        localStorage.setItem('xqcore.locale', locale);
    };

    /**
     * Returns a local string
     * @method getLocale
     * @return {[type]}  [description]
     */
    XQCore.getLocale = function() {
        var locale = localStorage.getItem('xqcore.locale');
        if (locale) {
            return locale;
        }

        return navigator.language;
    };

    /**
     * Defines a glovally log level
     *
     * XQCore has 5 log levels
     *
     * 0 = off
     * 1 = error
     * 2 = warning
     * 3 = info
     * 4 = debug
     * 5 = trace
     * 
     * @property {String} logLevel
     */
    XQCore.logLevel = 1;

    //--
    return XQCore;
}));


/**
 * XQCore Logger module
 *
 * Produces logging output to the browser console. This module is in all XQCore modules as var `log` available.
 * It is not necessary to instantiate it. The logger module has 5 logging levels: `ERROR, WARN, INFO, DEBUG, TRACE`.
 * The log-levels can be controlled by setting it globally by setting the XQCore.logLevel property,
 * or locally for each module by change the log.logLevel property. The locally property overrides the globally property 
 * for the current module.
 *
 * @module XQCore.Logger
 * 
 */
(function(XQCore, undefined) {
    'use strict';

    /**
     * XQCore Logger is a logging module to log messages, warnings, errors to the browser console
     * 
     * @constructor
     * @param {String} name Logger name (Optional)
     * 
     * @example {js}
     * var log = new XQCore.Logger('myLog');
     * log.log('Hello World');
     *
     * //Logs this to the console: [myLog] Hello World
     *
     * var log2 = new XQCore.Logger();
     * log2.log('Hello World');
     *
     * //Logs this to the console: Hello World
     *
     * 
     */
    var Logger = function(name) {
        this.loggerName = name;
        this.logLevel = XQCore.logLevel;
    };

    /**
     * Logs a message to the console.
     *
     * To log a message of this type a minimum logLevel of INFO is required.
     * Only the first given argument will be logged if log level is set to INFO.
     * To log all arguments, log level must be set to DEBUG.
     *
     * This method can have multiple arguments!
     *
     * @method log
     * @example {js}
     * log.logLevel = 3; //INFO
     * log.log('Write to console', {test: '123'});
     * //Logs only the first argument
     *
     * log.logLevel = 4;
     * log.log('Write to console with args', {test: '123'});
     * //Logs all arguments
     *
     * @param {Any} msg logs all arguments to the console
     */
    Logger.prototype.log = function() {
        var args;
        if (this.logLevel >= 3) {
            args = Array.prototype.slice.call(arguments);
            if (this.logLevel === 3) {
                args = [args[0]];
            }

            if (this.loggerName) {
                args.unshift('[' + this.loggerName + ']');
            }

            console.log.apply(console, args);
        }
    };

    /**
     * Logs a warning message to the console.
     *
     * To log a warning message of this type a minimum logLevel of WARNING is required.
     *
     * This method can have multiple arguments!
     *
     * @method warn
     * @example {js}
     * log.logLevel = 2; //WARNING
     * log.warn('Unvalid number', {test: '123'});
     *
     * @param {Any} msg logs all arguments to the console
     */
    Logger.prototype.warn = function() {
        var args;
        if (this.logLevel >= 2) {
            args = Array.prototype.slice.call(arguments);
            if (this.loggerName) {
                args.unshift('[' + this.loggerName + ']');
            }

            console.warn.apply(console, args);
        }

    };

    /**
     * Logs a error message to the console.
     *
     * To log a error message of this type a minimum logLevel of WARNING is required.
     *
     * This method can have multiple arguments!
     *
     * @method error
     * @example {js}
     * log.logLevel = 1; //ERROR
     * log.error('Unvalid number', {test: '123'});
     *
     * @param {Any} msg logs all arguments to the console
     */
    Logger.prototype.error = function() {
        var args;
        if (this.logLevel >= 1) {
            args = Array.prototype.slice.call(arguments);
            if (this.loggerName) {
                args.unshift('[' + this.loggerName + ']');
            }

            console.error.apply(console, args);
        }

    };

    /**
     * Logs a debug message to the console.
     *
     * To log a debug message of this type a minimum logLevel of DEBUG is required.
     * Only the first given argument will be logged if log level is set to DEBUG.
     * To log all arguments, log level must be set to TRACE.
     *
     * This method can have multiple arguments!
     *
     * @method debug
     * @example {js}
     * log.logLevel = 3; //DEBUG
     * log.debug('Write to console', {test: '123'});
     * //Logs only the first argument
     *
     * log.logLevel = 4;
     * log.debug('Write to console with args', {test: '123'});
     * //Logs all arguments
     *
     * @param {Any} msg logs all arguments to the console
     */
    Logger.prototype.debug = function() {
        var args;
        if (this.logLevel >= 4) {
            args = Array.prototype.slice.call(arguments);
            if (this.logLevel === 4) {
                args = [args[0]];
            }

            if (this.loggerName) {
                args.unshift('[' + this.loggerName + ']');
            }

            console.debug.apply(console, args);
        }
    };

    /**
     * Logs a log message to the console. This is just an alias for log
     *
     * @method info
     */
    Logger.prototype.info = Logger.prototype.log;

    /**
     * Start a timeTracer
     *
     * @method timer
     * @param {String} timerName Set the name for your (Optional)
     * @return {Object} Returns a TimerObject
     */
    Logger.prototype.timer = function(name) {
        var self = this;

        var timer = {
            start: null,
            stop: null,
            name: name,
            logger: this,
            end: function() {
                this.stop = Date.now();
                this.logger.log('Timer ' + name + ' finished after ' + self.getHumanTime(this.stop - this.start));
            }
        };

        /*if (name) {
            this.timerStore[name] = timer;
        }*/

        this.log('Start Timer ' + name);

        //Set timer start time
        timer.start = Date.now();
        return timer;
    };

    // --- new methods

    Logger.prototype.dev = function() {
        var args;

        if (this.debug) {
            args = Array.prototype.slice.call(arguments);
            if (this.loggerName) {
                args.unshift('[' + this.loggerName + ']');
            }
            
            console.debug.apply(console, args);
        }
    };

    Logger.prototype.req = Logger.prototype.log;
    Logger.prototype.res = Logger.prototype.log;

    Logger.prototype.getHumanTime = function(time) {
        if (time < 1000) {
            return time + 'ms';
        }
        else if (time < 60000) {
            return (Math.round(time / 100) / 10) + 'sec';
        }
        else {
            return (Math.round(time / 60000)) + 'min ' + Math.round(time % 60000 / 1000) + 'sec';
        }
    };

    XQCore.Logger = Logger;

})(XQCore);
/**
 * XQCore EventEmitter
 *
 * This module brings a node.js like event emitter support to XQCore.
 * Based on EventEmitter v4.2.11 by Oliver Caldwell
 * http://git.io/ee
 *
 * @module XQCore.Event
 */
(function(XQCore, undefined) {
	'use strict';

    var log = new XQCore.Logger('Socket');

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @private
     * @ignore
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @ignore
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @ignore
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @ignore
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @method on
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.on = function on(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        log.debug('Register "' + evt + '" as an event listener. Total listener length of this type is: ' + listeners[key].length);

        return this;
    };

    /**
     * Adds an event that will be
     * automatically removed after its first execution.
     *
     * @method once
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.once = function once(evt, listener) {
        return this.on(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @ignore
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @ignore
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @method off
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.off = function off(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;
        var len = 0;

        if (arguments.length === 1) {
            this.removeEvent(evt);
            return this;
        }

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    var removed = listeners[key].splice(index, 1);
                    len = removed.length;
                }
            }
        }

        log.debug('Remove an event listener of type "' + evt + '". Length of removed listeners is: ' + len);

        return this;
    };

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @ignore
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @ignore
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @ignore
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @ignore
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;
        var len;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    len = events[key].length;
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        log.debug('Remove an event listener of type "' + evt + '". Length of removed listeners is: ' + len);
        
        return this;
    };

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @ignore
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[key][i];

                    if (listener.once === true) {
                        this.off(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.off(evt, listener.listener);
                    }
                }
            }
        }

        log.debug('Emit an event of type "' + evt + '"', 'Args array:', args);

        return this;
    };

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @method emit
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @ignore
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @ignore
     * @private
     * @return {*|Boolean} The current value to check for or the default, true.
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @ignore
     * @private
     * @return {Object} The events storage object.
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

	XQCore.Event = EventEmitter;

})(XQCore);

/**
 * XQCore Presenter
 *
 * A presenter controlls your models, lists and views.
 * It renders views as long as any data had been changed.
 *
 * @module XQCore.Presenter
 */
(function(XQCore, undefined) {
    'use strict';

    var $ = XQCore.require('jquery'),
        log;

    /**
     * XQCore.Presenter base class
     *
     * @class XQCore.Presenter
     * @constructor
     *
     * @uses XQCore.Logger
     * @uses XQCore.Event
     *
     * @param {String} name Presenter name
     * @param {Function} fn Init callback and presenter scope method. To be called during the instantiating progress
     */
    var Presenter = function(name, fn) {
        var self = this;

        if (typeof arguments[0] === 'function') {
            fn = name;
            name = null;
        }

        /**
         * Set presenter name
         * @public
         * @type {String}
         */
        this.name = name || 'Nameless';

        /**
         * Router instance
         * @private
         * @type {Object}
         */
        this.__Router = new XQCore.Router();

        /**
         * Logger instance
         * @ignore
         * @type {Object}
         */
        log = new XQCore.Logger(this.name + 'Presenter');
        
        /**
         * Stores registered views
         * @private
         * @type {Object}
         */
        this.__views = {};

        if (typeof fn === 'function') {
            fn.call(this, self, log);
        }

        if (XQCore.html5Routes) {
            window.addEventListener('popstate', function(e) {
                self.__onPopstate(e.state);
            }, false);
        }
        else {
            window.addEventListener('hashchange', function(e) {
                self.__onPopstate(e.state);
            }, false);
        }

        var route = XQCore.defaultRoute;
        if (/^#![a-zA-Z0-9]+/.test(self.getHash())) {
            route = self.getHash().substr(2);
        }

        route = self.__Router.match(route);
        if (route) {
            var data = route.params;
            if (XQCore.callerEvent) {
                data[XQCore.callerEvent] = 'pageload';
            }

            $(function() {
                log.info('Trigger route', route, data);
                route.fn.call(self, route.params);
            });
        }
    };

    XQCore.extend(Presenter.prototype, new XQCore.Event());

    /**
     * Initialize a presenter
     *
     * @method init
     */
    Presenter.prototype.init = function() {
    };

    /**
     * Add a history item to the browser history
     *
     * @param {Object} data Data object
     * @param {String} url Page URL (Optional) defaults to the curent URL
     */
    Presenter.prototype.pushState = function(data, url) {
        // this.log('Check State', data, history.state, XQCore.compare(data, history.state));
        // if (XQCore.compare(data, history.state)) {
        //     this.warn('Abborting history.pushState because data are equale to current history state');
        // }
        var hash = XQCore.html5Routes || url.charAt(0) === '/' ? '' : XQCore.hashBang;
        url = hash + url;
        history.pushState(data, '', url || null);
        this.log('Update history with pushState', data, url);
    };

    /**
     * Add a history item to the browser history
     *
     * @param {Object} data Data object
     * @param {String} url Page URL (Optional) defaults to the current URL
     */
    Presenter.prototype.replaceState = function(data, url) {
        // if (data === history.state) {
        //     this.warn('Abborting history.replaceState because data are equale to current history state');
        // }
        var hash = XQCore.html5Routes || url.charAt(0) === '/' ? '' : XQCore.hashBang;
        url = hash + url;
        history.replaceState(data, '', url || null);
        this.log('Update history with replaceState', data, url);
    };

    /**
     * Navigates to a given route
     *
     * Options: {
     *  replace: <Boolean> Replace current history entry with route (Only when html5 routes are enabled)
     *  trigger: <Boolean> Set this to false to surpress a route change when new route equals to old route
     * }
     *
     * @param {String} route Route url
     * @param {Object} data Data object
     * @param {Object} options Options
     */
    Presenter.prototype.navigateTo = function(route, data, options) {
        this.log('Navigate to route: ', route, data, options);

        options = options || {};

        /*global PopStateEvent:false */
        if (XQCore.html5Routes) {
            if (options.replace) {
                this.replaceState(data, route);
            } else {
                this.pushState(data, route);
            }
            
            var evt = new PopStateEvent('popstate', {
                bubbles: false,
                cancelable: false,
                state: null
            });

            window.dispatchEvent(evt);
        }
        else {
            var hashRoute = XQCore.hashBang + route;
            if (options.trigger !== false && location.hash === hashRoute) {
                this.__onPopstate();
                return;
            }

            location.hash = hashRoute;
        }
    };

    /**
     * Navigate back
     * 
     * @method navigateBack
     */
    Presenter.prototype.navigateBack = function() {
        history.back();
    };

    /**
     * Gets a view by it's name
     *
     * @method getView
     * @param {String} viewName Required view name
     * @return {Object} Returns view object or null if no view was found
     */
    Presenter.prototype.getView = function(viewName) {
        return this.__views[viewName] || null;
    };

    /**
     * Returns the current hash
     *
     * @method getHash
     * @returns {String} Returns the current value from location.hash
     */
    Presenter.prototype.getHash = function() {
        return location.hash;
    };

    /**
     * Returns the current pathname
     *
     * @method getPathname
     * @returns {String} Returns the current value from location.pathname
     */
    Presenter.prototype.getPathname = function() {
        return location.pathname;
    };

    /**
     * Couple a model with a view
     *
     * @method couple
     * @chainable
     * @param {Object} conf Configuration object
     *
     * conf: {
     *   model: String modelname
     *   view: String viewname
     *   route String routename
     * }
     */
    Presenter.prototype.couple = function(view, model, conf) {
        var list = null,
            key;

        conf = conf || {};

        if (!view instanceof XQCore.View) {
            log.error('First arg is not a valid view in ' + this.name + ' presenter.couple()!');
        }

        if (!model instanceof XQCore.Model || !model instanceof XQCore.List) {
            log.error('Second arg is not a valid model or list in ' + this.name + ' presenter.couple()!');
        }
        
        if (model instanceof XQCore.List) {
            list = model;
            model = null;
        }

        //Old
        var modelEventConf = XQCore.extend({
            'data.replace': 'render',
            'data.item': 'xrender',
            'data.append': 'xrender',
            'data.prepend': 'xrender',
            'data.insert': 'insert',
            'data.remove': 'remove',
            'validation.error': 'validationFailed',
            'state.change': 'onStateChange'
        }, conf.modelEvents);

        var listEventConf = XQCore.extend({
            'item.push': 'xrender',
            'item.unshift': 'xrender',
            'item.pop': 'xrender',
            'item.shift': 'xrender',
            'state.change': 'onStateChange'
        }, conf.listEvents);

        var viewEventConf = XQCore.extend({
            'form.submit': 'submit'
        }, conf.viewEvents);

        if (!view instanceof XQCore.View) {
            log.error('Can\'t couple view with model! View isn\'t a XQCore.View');
            return;
        }

        if (model && !model instanceof XQCore.Model) {
            log.error('Can\'t couple model with model! Model isn\'t a XQCore.Model');
            return;
        }

        if (list && !list instanceof XQCore.List) {
            log.error('Can\'t couple list with list! List isn\'t a XQCore.List');
            return;
        }

        if (model) {
            log.info('Couple view ', view.name, 'with model', model.name);
        }

        if (list) {
            log.info('Couple view ', view.name, 'with list', list.name);
        }

        if (!view.__coupledWith) {
            view.__coupledWith = [];
        }

        if (model && !model.__coupledWith) {
            model.__coupledWith = [];
        }

        if (list && !list.__coupledWith) {
            list.__coupledWith = [];
        }

        if (model) {
            if (!view.__coupledWith.some(function(m) { return (m === model); })) {
                view.__coupledWith.push(model);
            }
            
            if (!model.__coupledWith.some(function(v) { return (v === view); })) {
                model.__coupledWith.push(view);
            }
        }

        if (list) {
            if (!view.__coupledWith.some(function(m) { return (m === list); })) {
                view.__coupledWith.push(list);
            }
            
            if (!list.__coupledWith.some(function(v) { return (v === view); })) {
                list.__coupledWith.push(view);
            }
        }

        var registerModelListener = function(listener, func) {
            var fn = function() {
                if (func === 'xrender') {
                    view.render(model.get());
                }
                else {
                    var args = Array.prototype.slice.call(arguments);
                    args.push(model.name, listener);
                    view[func].apply(view, args);
                }
            };

            fn.fnType = 'coupled-model-listener';
            fn.fnParent = view;
            model.on(listener, fn);
        };

        var registerListListener = function(listener, func) {
            var fn = function() {
                if (func === 'xrender') {
                    view.render(list.toArray());
                }
                else {
                    var args = Array.prototype.slice.call(arguments);
                    args.push(list.name, listener);
                    view[func].apply(view, args);
                }
            };

            fn.fnType = 'coupled-list-listener';
            fn.fnParent = view;
            list.on(listener, fn);
        };

        var registerViewListener;

        if (model) {
            registerViewListener = function(listener, func) {
                var fn = function(arg, arg2) {
                    model[func](arg, arg2, view.name);
                };

                fn.fnType = 'coupled-view-listener';
                fn.fnParent = model;
                view.on(listener, fn);
            };

            for (key in modelEventConf) {
                if (modelEventConf.hasOwnProperty(key)) {
                    registerModelListener(key, modelEventConf[key]);
                }
            }
        }

        if (list) {
            registerViewListener = function(listener, func) {
                var fn = function(arg, arg2) {
                    list[func](arg, arg2, view.name);
                };

                fn.fnType = 'coupled-view-listener';
                fn.fnParent = list;
                view.on(listener, fn);
            };

            for (key in listEventConf) {
                if (listEventConf.hasOwnProperty(key)) {
                    registerListListener(key, listEventConf[key]);
                }
            }
        }

        for (key in viewEventConf) {
            if (viewEventConf.hasOwnProperty(key)) {
                registerViewListener(key, viewEventConf[key]);
            }
        }

        //Initial view render with current model data
        if (model) {
            view.render(model.properties);
        }

        if (list) {
            view.render(list.toArray());
        }

        if (conf.forms) {
            view.formSetup(model);
        }

        return this;
    };


    /**
     * PopstateEvent
     *
     * @method __onPopstate
     * @param {Object} data Event data
     * @private
     */
    Presenter.prototype.__onPopstate = function(data) {
        var self = this;

        self.log('popstate event recived', data, self);

        var route = XQCore.defaultRoute;
        if (XQCore.html5Routes) {
            var pattern = new RegExp('^' + self.root);
            route = self.getPathname().replace(pattern, '');
        }
        else {
            if (/^#!\S+/.test(this.getHash())) {
                route = self.getHash().substr(2);
            }
        }

        route = self.__Router.match(route);
        if (route) {
            data = data || route.params;
            if (XQCore.callerEvent) {
                data[XQCore.callerEvent] = 'popstate';
            }

            self.log('Trigger route', route, data);

            route.fn.call(self, data);
        }
    };

    /**
     * Initialize a new view into the presenter scope
     *
     * options: {
     *   mode: String       Insert mode, (append, prepend or replace) replace is default
     *   inject: Boolean    Set to false to disable injecting view into the DOM
     * }
     * 
     * @method initView
     * @public
     * @param  {String} viewName  Name of the view
     * @param  {String} container Container selector, default is 'body'
     * @param  {Object} options   View options
     * @return {Object}           Returns a view object
     */
    Presenter.prototype.initView = function(viewName, container, options) {
        options = options || {};

        var view = new XQCore.View(viewName, function(self) {
            self.template = XQCore.Tmpl.getTemplate(viewName);
            self.mode = options.mode || 'replace';
            self.container = container || 'body';
            self.hidden = !!options.hidden;
            if (options.inject === false) {
                self.autoInject = false;
            }
        });

        this.__views[viewName] = view;
        return view;
    };

    /**
     * Register a route listener
     *
     * @public
     * @method route
     * @param {String | Array} route Route string
     * @param {Function} callback Callback function
     */
    Presenter.prototype.route = function(route, callback) {
        var self = this;

        if (typeof callback === 'string') {
            callback = this[callback];
        }

        if (typeof callback === 'function') {
            if (typeof route === 'string') {
                log.info('Register route', route, 'with callback', callback);
                this.__Router.addRoute(route, callback);
            }
            else if (Array.isArray(route)) {
                route.forEach(function(r) {
                    log.info('Register route', r, 'with callback', callback);
                    self.__Router.addRoute(r, callback);
                });
            }

        }
        else {
            log.warn('Router callback isn\'t a function', callback, 'of route', route);
        }
    };

    /**
     * Return Presenter
     */
    XQCore.Presenter = Presenter;

})(XQCore);

/**
 * XQCore.Sync
 *
 * @module  XQCore.Sync
 */
(function(XQCore, undefined) {
	'use strict';

	var $ = XQCore.require('jquery');

	var Sync = function() {

	};

	/**
	 * Called on before sending an ajax request
	 * You can use this function to manipulate all data they be send to the server
	 *
	 * @param {Object} data The data to send to the server
	 * @return {Object} data
	 */
	Sync.prototype.onSend = function(data) {
		return data;
	};

	/**
	 * Send an ajax request to the webserver.
	 *
	 * You must set the server URI first with model.server = 'http://example.com/post'
	 *
	 * @param {String} Method send method, GET, POST, PUT, DELETE (default POST)
	 * @param {String} url Server URL (optional, then model.server must be set)
	 * @param {Object} data The data to sent to the server
	 * @param {Function} callback Calls callback(err, data, status, jqXHR) if response was receiving
	 */
	Sync.prototype.send = function(method, url, data, callback) {
		var self = this;

		if (typeof url === 'object') {
			callback = data;
			data = url;
			url = this.server;
			method = method;
		}
		else if (typeof data === 'function') {
			callback = data;
			data = this.get();
		}
		else if (data === undefined) {
			data = this.get();
		}

		if (method === undefined) {
			method = 'POST';
		}

		if (!url) {
			url = this.server;
		}

		if (method === 'GET' && Array.isArray(data)) {
			url = url.replace(/\/$/, '') + '/' + data.join('/');
			data = null;
		}

		//Handle onSend
		if (typeof this.onSend === 'function') {
			data = this.onSend.call(this, data);
		}

		this.log('Send an ajax call to ', url, 'with data: ', data);
		this.state('syncing');

		$.ajax({
			url: url,
			type: method,
			data: data,
			dataType: 'json',
			success: function(data, status, jqXHR) {
				if (typeof callback === 'function') {
					callback.call(self, null, data, status, jqXHR);
				}
				self.state('success');
			},
			error: function(jqXHR, status, error) {
				if (typeof callback === 'function') {
					callback.call(self, {
						type: status,
						http: error
					}, null, status, jqXHR);
				}
				self.state('failed');
			}
		});
	};

	/**
	 * Sends a POST to the Datastore
	 *
	 * @param {String} url Server URL (optional, then model.server must be set)
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	Sync.prototype.sendPOST = function(url, data, callback) {
		this.send('POST', url, data, callback);
	};

	/**
	 * Sends a GET to the Datastore
	 *
	 * @param {String} url Server URL (optional, then model.server must be set)
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	Sync.prototype.sendGET = function(url, data, callback) {
		this.send('GET', url, data, callback);
	};

	/**
	 * Sends a PUT to the Datastore
	 *
	 * @param {String} url Server URL (optional, then model.server must be set)
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	Sync.prototype.sendPUT = function(url, data, callback) {
		this.send('PUT', url, data, callback);
	};

	/**
	 * Sends a DELETE to the Datastore
	 *
	 * @param {String} url Server URL (optional, then model.server must be set)
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	Sync.prototype.sendDELETE = function(url, data, callback) {
		this.send('DELETE', url, data, callback);
	};

	/**
	 * Check if model is ready and call func or wait for ready state
	 */
	Sync.prototype.ready = function(func) {
		var self = this;
		
		if (func === true) {
			//Call ready funcs
			if (Array.isArray(this.__callbacksOnReady)) {
				this.log('Trigger ready state');
				this.__callbacksOnReady.forEach(function(func) {
					func.call(self);
				});
			}

			this.__isReady = true;
			delete this.__callbacksOnReady;
		}
		else if (typeof func === 'function') {
			if (this.__isReady === true) {
				func();
			}
			else {
				if (!this.__callbacksOnReady) {
					this.__callbacksOnReady = [];
				}
				this.__callbacksOnReady.push(func);
			}
		}
		else {
			this.warn('arg0 isn\'t a callback in model.ready()!');
		}
	};

	/**
	 * Fetch data from server
	 *
	 * @param {Object} query MongoDB query 
	 * @param {Function} callback Callback function
	 */
	Sync.prototype.fetch = function(query, callback) {
		this.sendGET(query, callback);
	};

	/**
	 * Save a model if it's valid
	 */
	Sync.prototype.save = function(data, callback) {
		if (typeof data === 'function') {
			callback = data;
			data = this.schema ? this.getByKeys(Object.keys(this.schema)) : this.get();
		}

		if (this.isValid()) {
			this.sendPOST(data, callback);
		}
		else {
			if (typeof callback === 'function') {
				callback({
					msg: 'Model isn\'t valid. Cancle save'
				});
			}
		}
	};

	/**
	 * Update a model if it's valid
	 */
	Sync.prototype.update = function(data, callback) {
		if (typeof data === 'function') {
			callback = data;
			data = this.schema ? this.getByKeys(Object.keys(this.schema)) : this.get();
		}

		if (this.isValid()) {
			this.sendPUT(data, callback);
		}
		else {
			if (typeof callback === 'function') {
				callback({
					msg: 'Model isn\'t valid. Cancel update'
				});
			}
		}
	};

	/**
	 * To be called when a form was submited in a coupled model
	 *
	 * This method merges submited form data with model.
	 * If validation doesen't fail, update or save methode have to be called.
	 * It calls update if data.id is not undefined, otherwise it calls save
	 * Override this function if this behavior isn't desired 
	 * 
	 * @method sync
	 * @override
	 * @param  {Any} data     data
	 */
	Sync.prototype.submit = function(data) {
		if (this.set(data, { extend: true })) {
			if (data.id === undefined || data.id === null) {
				this.save(data);
				return;
			}

			this.update(data);
		}
	};

	XQCore.Sync = Sync;

})(XQCore);
/**
 * XQCore Model
 *  
 * @module  XQCore.Model
 * @requires XQCore.Utils
 * @requires XQCore.Event
 * @requires XQCore.Logger
 */
(function(XQCore, undefined) {
    'use strict';
    var Model;

    /**
     * XQCore.Model base class
     *
     * @class XQCore.Model
     * @constructor
     *
     * @uses XQCore.Logger
     * @uses XQCore.Event
     *
     * @param {Object} conf Model extend object
     */
    Model = function(name, conf) {
        if (typeof arguments[0] === 'object') {
            conf = name;
            name = conf.name;
        }

        /**
         * Enable debug mode
         * @public
         * @type {Boolean}
         */
        this.debug = XQCore.debug;

        /**
         * Stores models properties
         * @type {Object}
         * @property properties
         */
        this.properties = {};

        if (conf === undefined) {
            conf = {};
        }

        if (typeof conf === 'function') {
            conf.call(this, this);
        }
        else {
            XQCore.extend(this, conf);
        }

        this.__state = 'starting';
        this.__unfiltered = {};

        this.customValidate = conf.validate;
        delete conf.validate;

        this.conf = conf;

        this.name = (name ? name.replace(/Model$/, '') : 'Nameless') + 'Model';
        this._isValid = false;

        //Add default values
        if (this.defaults && !XQCore.isEmptyObject(this.defaults)) {
            this.set(this.defaults, {
                silent: true,
                noValidation: true,
                extend: true
            });
        }

        this._isValid = !this.schema;
        this.state('ready');
    };


    XQCore.extend(Model.prototype, new XQCore.Event(), new XQCore.Logger());

    if (XQCore.Sync) {
        XQCore.extend(Model.prototype, XQCore.Sync.prototype);
    }

    Model.inherit = function(name, options) {
        if (typeof name === 'object') {
            options = name;
            name = undefined;
        }

        var Proto = function() {
            XQCore.Model.call(this, name, options);
        };

        Proto.prototype = Object.create(XQCore.Model.prototype);
        Proto.prototype.constructor = Proto;
        return Proto;
    };

    /**
     * Init
     * @deprecated v0.10.0
     * @method init
     */
    Model.prototype.init = function() {
        console.warn('Model.init is deprecated since v0.10.0');
    };

    /**
     * Change the model state
     *
     * @method state
     * @param {String} state New state
     */
    Model.prototype.state = function(state) {
        this.__state = state;
        this.emit('state.' + state);
        this.emit('state.change', state);
    };

    /**
     * Get the current model state
     *
     * @method getState
     */
    Model.prototype.getState = function() {
        return this.__state;
    };

    /**
     * Set model data
     *
     * Triggers a data.change event if data was set succesfully
     *
     * @method set
     * @param {Object} data
     */
    
    /**
     * Set model data
     *
     * Triggers these events if data was set succesfully<br>
     * data.change<br>
     * &lt;key&gt;.change
     *
     * options: {
     *   silent: <Boolean> Don't trigger any events
     *   noValidation: <Boolean> Don't validate
     *   validateOne: <Boolean> Only if setting one item, validate the item only
     *   replace: <Boolean> Replace all date with new data
     *   sync: <Boolean> Calles sync method if validations succeeds. Default: false
     * }
     *
     * @method set
     * @param {String} key
     * @param {Object} value Data value
     * @param {Object} options Options
     */
    Model.prototype.set = function(key, value, options) {
        var newData = {},
            oldData = this.get(),
            validateResult,
            setItem = false,
            setAll = false;

        options = options || {};

        if (arguments[0] === null) {
            newData = arguments[1];
            setAll = true;
            this.log('Set data', newData, oldData);
        }
        else if (typeof arguments[0] === 'object') {
            //Add a dataset
            options = value || {};
            newData = options.replace ? arguments[0] : XQCore.extend(newData, oldData, arguments[0]);
            setAll = true;
            key = null;
            this.log('Set data', newData, oldData);
        }
        else if (typeof arguments[0] === 'string') {
            newData = XQCore.extend({}, this.get());
            setItem = true;
            XQCore.dedotify(newData, key, value);
            this.log('Set data', newData, oldData);

            options = options || {};
            if (!this.customValidate && options.validateOne) {
                options.noValidation = true;
                validateResult = this.validateOne(this.schema[key], value);
                if (validateResult.isValid === false) {
                    validateResult.error = validateResult.error || {};
                    validateResult.error.property = key;
                    this.warn('Validation error in model.set of property', key, validateResult);
                    if (options.silent !== true) {
                        this.emit('validation.error', validateResult, newData);
                    }
                    return false;
                }
            }
        }
        else {
            this.warn('Data are incorrect in model.set()', arguments);
        }

        options = options || {};

        if (!this.customValidate && this.schema && options.noValidation !== true) {
            validateResult = this.validate(newData);
            if (validateResult !== null) {
                this.warn('Validate error in model.set', validateResult);
                if (options.silent !== true) {
                    this.emit('validation.error', validateResult, newData);
                }
                return false;
            }
        }

        if (this.customValidate && options.noValidation !== true) {
            validateResult = this.customValidate(newData);
            this.log('Using a custom validation which returns:', validateResult);
            if (validateResult !== null) {
                this.warn('Validate error in model.set', validateResult);
                this.emit('validation.error', validateResult, newData);
                return false;
            }
        }

        this.properties = newData;
        if (options.silent !== true) {
            if (setAll) {
                if (typeof this.sync === 'function' && options.sync === true) {
                    this.sync('set', newData);
                }
                else {
                    this.emit('data.replace', newData, oldData);
                }
            }
            else if (setItem){
                if (typeof this.sync === 'function' && options.sync === true) {
                    this.sync('item', key, value);
                }
                
                this.emit('data.item', key, value);
            }

            this.emit('data.change', newData, oldData);
        }

        return true;
    };

    /**
     * Get one or all properties from a dataset
     *
     * <b>Options:</b>
     *   copy: <Boolean>  //Set it to true to get a copy of the dataset
     *
     * @param {String} key Data key
     * @param {Object} options Set options
     *
     * @return {Object}     model dataset
     */
    Model.prototype.get = function(key, options) {
        options = options || {};

        var data;

        if (typeof key === options && key !== null) {
            options = key;
            key = null;
        }

        if (key === undefined || key === null) {
            if (options.copy === true) {
                data = this.properties;
                switch (typeof data) {
                    case 'object':
                        return Array.isArray(data) ? data.slice() : XQCore.extend(true, {}, data);
                    case 'function':
                        //jshint evil:true
                        return eval('(' + data.toString() + ')');
                    default:
                        return data;
                }
            }

            return this.properties;
        }
        else {
            if (options.copy === true) {
                data = XQCore.undotify(key, this.properties);
                switch (typeof data) {
                    case 'object':
                        return Array.isArray(data) ? data.slice() : XQCore.extend(true, {}, data);
                    case 'function':
                        //jshint evil:true
                        return eval('(' + data.toString() + ')');
                    default:
                        return data;
                }
            }
            
            return XQCore.undotify(key, this.properties);
        }
    };

    /**
     * Get items filtered by a key array or object
     * @param  {Object|Array} keys Key array
     * @param  {Object} data (Optional) Data to be filtered. Uses model data if it is undefined
     * @return {Object}      Returns a filtered data object
     */
    Model.prototype.getByKeys = function(keys, data) {
        if (typeof keys !== 'object') {
            throw new Error('First param must be an object or array in Model.getByKeys()!');
        }

        var out = {};
        
        data = data || this.get();

        if (Array.isArray(keys)) {
            keys.forEach(function(key) {
                if (key.indexOf('.') === -1) {
                    out[key] = data[key];
                }
                else {
                     out = XQCore.dedotify(out, key, XQCore.undotify(key, data));
                }
            });
        }
        else {
            for (var k in keys) {
                if (keys.hasOwnProperty(k)) {
                    var item = data[k];
                    if (typeof item === 'object') {
                        out[k] = this.getByKeys(keys[k], data[k]);
                    }
                    else {
                        out[k] = data[k];
                    }
                }
            }
        }

        return out;
    };

    /**
     * Check wether model has a dataset
     *
     * @method  has
     * @param {String} key Dataset key
     * @return {Boolean} Returns true if model has a dataset with key
     */
    Model.prototype.has = function(key) {
        var hasKey = true,
            obj = this.properties;

        key = key.split('.');
        for (var i = 0, len = key.length; i < len; i++) {
            if (typeof obj === 'object' && obj.hasOwnProperty(key[i])) {
                obj = obj[key[i]];
                continue;
            }

            hasKey = false;
            break;
        }

        return hasKey;
    };

    /**
     * Remove all data from model
     *
     * @method reset
     * @chainable
     */
    Model.prototype.reset = function(removeListener) {
        this.log('Reset model');
        var oldData = this.get();
        this.properties = XQCore.extend({}, this.defaults);
        this.state('starting');
        if (removeListener) {
            this.removeEvent();
        }
        else {
            this.emit('data.reset', oldData);
        }
        
        return this;
    };

    /**
     * Append data to a subset
     *
     * @method append
     * @param {String} path path to subset
     * @param {Object} data data to add
     */
    Model.prototype.append = function(path, data, options) {
        var dataset = XQCore.undotify(path, this.properties);

        options = options || {};

        if (dataset instanceof Array) {
            dataset.push(data);
        }
        else if (typeof dataset === 'undefined') {
            XQCore.dedotify(this.properties, path, [data]);
        }
        else if (typeof dataset === 'object' && !path && XQCore.isEmptyObject(this.properties)) {
            this.properties = [data];
        }
        else {
            this.error('Model.append requires an array. Dataset isn\'t an array. Path: ', path);
            return;
        }

        if (options.silent !== true) {
            if (typeof this.sync === 'function' && options.sync === true) {
                this.sync('append', path, data);
            }

            this.emit('data.append', path, data);
            this.emit('data.change', this.properties);
        }
    };

    /**
     * Prepend data to a subset
     *
     * @method prepend
     * @param {String} path path to subset
     * @param {Object} data data to add
     */
    Model.prototype.prepend = function(path, data, options) {
        var dataset = XQCore.undotify(path, this.properties);

        options = options || {};

        if (dataset instanceof Array) {
            dataset.unshift(data);
        }
        else if (typeof dataset === 'undefined') {
            XQCore.dedotify(this.properties, path, [data]);
        }
        else if (typeof dataset === 'object' && !path && XQCore.isEmptyObject(this.properties)) {
            this.properties = [data];
        }
        else {
            this.error('Model.prepend requires an array. Dataset isn\'t an array. Path: ', path);
            return;
        }

        if (options.silent !== true) {
            if (typeof this.sync === 'function' && options.sync === true) {
                this.sync('prepend', path, data);
            }

            this.emit('data.prepend', path, data);
            this.emit('data.change', this.properties);
        }
    };

    /**
     * Insert data into a subset at a given index
     * 
     * @method insert
     * @param {String} path Path to subset
     * @param {Number} index The index where the data should be inserted
     * @param {Object} data Dataset to be inserted
     * @param {Object} options Inserting options
     */
    Model.prototype.insert = function(path, index, data, options) {
        var dataset = XQCore.undotify(path, this.properties);

        options = options || {};

        if (dataset instanceof Array) {
            dataset.splice(index, 0, data);
        }
        else if (typeof dataset === 'undefined') {
            XQCore.dedotify(this.properties, path, [data]);
        }
        else if (typeof dataset === 'object' && !path && XQCore.isEmptyObject(this.properties)) {
            this.properties = [data];
        }
        else {
            this.error('Model.insert requires an array. Dataset isn\'t an array. Path: ', path);
            return;
        }

        if (options.silent !== true) {
            if (typeof this.sync === 'function' && options.sync === true) {
                this.sync('insert', path, 1, data);
            }

            this.emit('data.insert', path, index, data);
            this.emit('data.change', this.properties);
        }
    };

    /**
     * Remove a subset
     *
     * @method remove
     * @param {String} path path to subset
     * @param {Number} index Index of the subsut to remove
     * @param {Object} options Remove options
     *
     * @return {Object} removed subset
     */
    Model.prototype.remove = function(path, index, options) {
        var dataset = XQCore.undotify(path, this.properties),
            removed = null;


        options = options || {};

        if (dataset instanceof Array) {
            removed = dataset.splice(index, 1);
        }
        else if (typeof dataset === 'object') {
            this.error('Model.remove requires an array. Dataset isn\'t an array. Path: ', path);
            return;
        }

        if (removed && options.silent !== true) {
            if (typeof this.sync === 'function' && options.sync === true) {
                this.sync('remove', path, index);
            }

            this.emit('data.remove', path, index, removed[0]);
            this.emit('data.change', this.properties);
        }

        return removed;
    };

    /**
     * Replace all models data with new data. This is a alias for set(<AnyData>, {replace: true})
     *
     * @method repalce
     * @param {Object} data Data object
     * @param {Object} options Option data. (See set method for details)
     */
    Model.prototype.repalce = function(data, options) {
        options = options || {};
        options.repalce = true;
        return this.set(data, options);
    };

    /**
     * Search an item in models properties
     *
     * @method search
     * @param {String} path Path to the parent property. We use dot notation to navigate to subproperties. (data.bla.blub) (Optional)
     * @param {Object} searchfor Searching for object
     * @return {Object} Returns the first matched item or null
     */
    Model.prototype.search = function(path, searchfor) {
        var parent;

        if (arguments.length === 1) {
            searchfor = path;
            path = '';
            parent = this.properties;
        }
        else if (!path) {
            parent = this.properties;
        }
        else {
            parent = XQCore.undotify(path, this.properties);
        }

        if (parent) {
            for (var i = 0; i < parent.length; i++) {
                var prop = parent[i],
                    matching;

                for (var p in searchfor) {
                    if (searchfor.hasOwnProperty(p)) {
                        if (prop[p] && prop[p] === searchfor[p]) {
                            matching = true;
                            break;
                        }
                        else {
                            matching = false;
                        }
                    }
                }

                if (matching === true) {
                    return prop;
                }

            }
        }

        return null;
    };

    /**
     * Modify a dataset
     * @development
     * 
     * @method modify
     * @param {[type]} path [description]
     * @param {[type]} match [description]
     * @param {[type]} data [description]
     * @returns {[type]} [description]
     */
    Model.prototype.modify = function(path, match, data) {
        var item = this.search(path, match);
        if (item) {
            XQCore.extend(item, data);
            this.emit('data.modify', path, data, item);
            this.emit('data.change', this.properties);
        }
    };

    /**
     * Sort an array collection by a given attribute
     *
     * @method  sortBy
     * @param {String} path Path to the collection
     * @param {Object} sortKeys Sort by key
     *
     * sortKeys: {
     *   'key': 1 // Sort ascend by key,
     *   'second.key': -1 // Sort descand by second.key
     * }
     *
     * ascend, a -> z, 0 - > 9 (-1)
     * descend, z -> a, 9 -> 0 (1)
     * 
     */
    Model.prototype.sortBy = function(path, sortKeys) {
        if (arguments.length === 1) {
            sortKeys = path;
            path = null;
        }

        var data = XQCore.undotify(path, this.properties),
            order;

        if (!Array.isArray(data)) {
            this.warn('Could not sort data of type', typeof data);
            return [];
        }

        data.sort(function(a, b) {
            order = -1;
            for (var key in sortKeys) {
                if (sortKeys.hasOwnProperty(key)) {
                    order = String(XQCore.undotify(key, a)).localeCompare(String(XQCore.undotify(key, b)));
                    if (order === 0) {
                        continue;
                    }
                    else if(sortKeys[key] === -1) {
                        order = order > 0 ? -1 : 1;
                    }

                    break;
                }
            }

            return order;
        });

        this.set(path, data);
        return data;
    };

    /**
     * Filter an array collection by a given filter function
     *
     * @method filter
     * @param {String} path Path to the collection
     * @param {String | Function} filter Filter function
     *
     */
    Model.prototype.filter = function(path, property, query, fn) {
        if (arguments.length === 1) {
            fn = path;
            path = null;
        }

        if (typeof fn === 'string') {
            if (this.__registeredFilter[fn]) {
                fn = this.__registeredFilter[fn];
            }
            else {
                throw new Error('Filter ' + fn + ' not registered!');
            }
        }

        //We use a for i instead of Array.filter because it's faster!
        var data = XQCore.undotify(path, this.__unfiltered.data || this.properties);
        var filtered = [];
        for (var i = 0, len = data.length; i < len; i++) {
            if (fn(property, query, data[i])) {
                filtered.push(data[i]);
            }
        }

        this.__unfiltered = {
            path: path,
            data: data
        };

        this.set(path, filtered);
        return filtered;
    };

    /**
     * Resets a filter
     * @method filterReset
     * @param {Object} options Set options
     */
    Model.prototype.filterReset = function(options) {
        if (this.__unfiltered) {
            this.set(this.__unfiltered.path, this.__unfiltered.data, options);
        }
    };

    /**
     * Validate model
     * @method validate
     * @param {Object} data Data to be validated
     * @param {Object} schema Schema
     * @returns {Object} Returns an object with failed validations or null if validation succeeds
     */
    Model.prototype.validate = function(data, schema) {
        var self = this,
            failed = [];
            
        schema = schema || this.schema;

        if (schema) {
            Object.keys(schema).forEach(function(key) {
                if (typeof data[key] === 'object' && typeof schema[key].type === 'undefined') {
                    var subFailed = self.validate(XQCore.extend({}, data[key]), XQCore.extend({}, schema[key]));
                    if (Array.isArray(subFailed) && subFailed.length > 0) {
                        failed = failed.concat(subFailed);
                    }
                    return;
                }
                
                var validationResult = self.validateOne(schema[key], data[key]);

                if (validationResult.isValid === true) {
                    data[key] = validationResult.value;
                }
                else {
                    validationResult.error.property = key;
                    failed.push(validationResult.error);
                }
            });
        }

        if (failed.length === 0) {
            this._isValid = true;
            this.state('valid');
            return null;
        }
        else {
            this._isValid = false;
            this.state('invalid');
            return failed;
        }
    };

    /**
     * Validate one property
     *
     * ValidatorResultItemObject
     * {
     *   isValid: Boolean,
     *   value: Any,
     *   error: Object
     * }
     *
     * @param  {Any} schema Schema for the check
     * @param  {Any} value Property value
     *
     * @return {Object}       Returns a ValidatorResultItemObject
     */
    Model.prototype.validateOne = function(schema, value, propName) {
        var failed,
            schemaType = typeof schema.type === 'function' ? typeof schema.type() : schema.type.toLowerCase();

        if (value === '' && schema.noEmpty === true) {
            value = undefined;
        }

        if ((value === undefined || value === null || value === '') && schema['default']) {
            value = schema['default'];
        }

        if ((value === undefined || value === null || value === '')) {
            if (schema.required === true) {
                failed = {
                    msg: 'Property is undefined or null, but it\'s required',
                    errCode: 10
                };
            }
        }
        else {
            if (this.__registeredValidations[schemaType]) {
                failed = this.__registeredValidations[schemaType].call(this, value, schema);
            }
            else {
                throw new Error('Undefined schema type', schema);
            }
        }

        if (failed === undefined) {
            failed = {
                isValid: true,
                value: value,
                error: null
            };
        }
        else {
            failed = {
                isValid: false,
                value: value,
                error: failed
            };
        }

        return failed;
    };

    /**
     * Returns the validation state of the model
     * 
     * @method isValid
     * @returns {Boolean} Returns true when model data are valid. When no data was set it'll returns false
     */
    Model.prototype.isValid = function() {
        return this._isValid;
    };

    /**
     * To be called when a form has been submited in a coupled model
     *
     * Model gets <i>submited</i> state when validation succeeds
     * If validation fails, model gets <i>invalid</i> state
     *
     * @deprecated
     * @method setData
     * @param {Object} data Form data
     */
    Model.prototype.setData = function(data, caller) {
        this.warn('Model.setData has been deprecated since v0.9');
        this.set(data, {
            extend: true
        });
    };

    /**
     * Register a filter function 
     *
     * XQCore.Model.registerFilter('myfilter', fn);
     * Registers a filter for all models
     *
     * instance.registerFilter('myfilter', fn);
     * Registers a filter for the instance only.
     * 
     * @method registerFilter
     * @param {String} filterName [description]
     * @param {Function} filterFunction [description]
     */
    Model.registerFilter = function(filterName, filterFunction) {
        if (typeof filterFunction !== 'function') {
            throw new Error('Filter function isn\'t a function');
        }

        var obj = typeof this === 'function' ? Model.prototype : this;
        obj.__registeredFilter[filterName] = filterFunction;
    };

    /**
     * Alias for Model.registerFilter
     * @type {method}
     */
    Model.prototype.registerFilter = Model.registerFilter;

    /**
     * Holds registered filter
     * @type {Object}
     * @private
     */
    Model.prototype.__registeredFilter = {
        quicksearch: function(property, query, item) {
            var value = XQCore.undotify(property, item);
            var pat = new RegExp(query.replace(/[a-z0-9äüöß]/g, '$&.*'), 'i');
            return pat.test(value);
        }
    };

    /**
     * Register validation metods for all Models
     *
     * @method registerValidation
     * @static
     * @param {String} type Data type
     * @param {Function} fn Validation function
     */
    Model.registerValidation = function(type, fn) {
        var obj = typeof this === 'function' ? Model.prototype : this;
        obj.__registeredValidations[type] = fn;
    };

    /**
     * Register new validation method for currentyl instanciated model
     *
     * @method registerValidation
     * @param {String} type Data type
     * @param {Function} fn Validation function
     */
    Model.prototype.registerValidation = Model.registerValidation;

    /**
     * Stores registered validatiion functions
     * @type {Object}
     * @private
     */
    Model.prototype.__registeredValidations = {
        'string': function(value, schema) {
            if (schema.convert && typeof(value) === 'number') {
                value = String(value);
            }

            if ('string' !== typeof(value)) {
                return {
                    msg: 'Property type is a ' + typeof(value) + ', but a string is required',
                    errCode: 11
                };
            }
            else if(schema.min && schema.min > value.length) {
                return {
                    msg: 'String length is too short',
                    errCode: 12
                };
            }
            else if(schema.max && schema.max < value.length) {
                return {
                    msg: 'String length is too long',
                    errCode: 13
                };
            }
            else if(schema.match && !schema.match.test(value)) {
                return {
                    msg: 'String doesn\'t match regexp',
                    errCode: 14
                };
            }
        },
        'number': function(value, schema) {

            if (schema.convert && typeof(value) === 'string') {
                value = parseInt(value, 10);
            }

            if ('number' !== typeof value || isNaN(value)) {
                return {
                    msg: 'Property type is not a valid number',
                    errCode: 21
                };
            }
            else if(schema.min && schema.min > value) {
                return {
                    msg: 'Number is too low',
                    errCode: 22
                };
            }
            else if(schema.max && schema.max < value) {
                return {
                    msg: 'Number is too high',
                    errCode: 23
                };
            }
        },
        'date': function(value, schema) {
            if (value) {
                var date = Date.parse(value);
                if (isNaN(date)) {
                    return {
                        msg: 'Property isn\'t a valid date',
                        errCode: 31
                    };
                }
            }
        },
        'array': function(value, schema) {
            if (!Array.isArray(value)) {
                return {
                    msg: 'Property type is a ' + typeof(value) + ', but an array is required',
                    errCode: 41
                };
            }
            else if(schema.min && schema.min > value.length) {
                return {
                    msg: 'Array length is ' + value.length + ' but must be greater than ' + schema.min,
                    errCode: 42
                };
            }
            else if(schema.max && schema.max < value.length) {
                return {
                    msg: 'Array length is ' + value.length + ' but must be lesser than ' + schema.max,
                    errCode: 43
                };
            }
        },
        'object': function(value, schema) {
            if (typeof(value) !== 'object') {
                return {
                    msg: 'Property isn\'t a valid object',
                    errCode: 51
                };
            }
        },
        'objectid': function(value, schema) {
            if (!/^[a-zA-Z0-9]{24}$/.test(value)) {
                return {
                    msg: 'Property isn\'t a valid objectId',
                    errCode: 52
                };
            }
        },
        'boolean': function(value, schema) {
            if (typeof(value) !== 'boolean') {
                return {
                    msg: 'Property isn\'t a valid boolean',
                    errCode: 61
                };
            }
        },

        /**
         * Validation type time
         *
         * Allowed values are:
         * HH:MM
         * HH:MM:SS
         * D:HH:MM:SS
         */
        'time': function(value, schema) {
            if (!/^\d+(:\d{2}){1,3}$/.test(value)) {
                return {
                    msg: 'Property isn\'t a valid time',
                    errCode: 61
                };
            }
        }
    };

    XQCore.Model = Model;
})(XQCore);

/*global define:false */
(function (root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		define('xqcore', [XQCore.templateEngine], factory);
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(require(XQCore.templateEngine));
	} else {
		var engine = XQCore.templateEngine === 'firetpl' ? 'FireTPL' : 'Handlebars';
		root.XQCore = factory(root[engine]);
	}

}(this, function (TemplateEngine) {
	'use strict';

	XQCore.Tmpl = {
		type: XQCore.templateEngine,
		compile: TemplateEngine.compile,
		getTemplate: function(viewName) {
			if (XQCore.templateEngine === 'firetpl') {
				var FireTPL = TemplateEngine;
				if (FireTPL.templateCache && FireTPL.templateCache[viewName]) {
					return FireTPL.templateCache[viewName];
				}
				else if(!FireTPL.loadFile) {
					throw new Error('FireTPL runtime is being used. Please preload the ' + viewName + 'View');
				}
				else {
					var tmpl = FireTPL.readFile(XQCore.viewsDir.replace(/\/$/, '') + '/' + viewName + '.' + XQCore.viewExt.replace(/^\./, ''));
					return FireTPL.compile(tmpl);
				}
			}
		}
	};

	return XQCore;
}));

/**
 * XQCore View module
 *
 * A view renders a .fire or .hbs template and injects the result into the dom.
 *
 * @module XQCore.View
 * @returns {object} Returns a XQCore.View prototype object
 */
(function(XQCore, undefined) {
    'use strict';

    var $ = XQCore.require('jquery'),
        log;

    /**
     * XQCore.View
     *
     * @class XQCore.View
     * @constructor
     * 
     * @param {object} conf View configuration
     */
    var View = function(name, conf) {
        if (typeof arguments[0] === 'object' || typeof arguments[0] === 'function') {
            conf = name;
            name = null;
        }
        else if (typeof arguments[0] === 'string') {
            this.name = name;
        }

        /**
         * Logger instance
         * @ignore
         * @type {Object}
         */
        log = new XQCore.Logger(this.name + 'View');

        /**
         * Sets the container element
         * @property container
         * @type Selector
         * @default 'body'
         */
        this.container = 'body';

        /**
         * Set the view element tag. If no tag are set, a tag dependent from its parent type will be created
         *
         * Tag types dependent from parent:
         * 
         * | parent  | view tag |
         * ----------------------
         * | body    | section  |
         * | section | section  |
         * | ul      | li       |
         * | table   | tbody    |
         * | tbody   | tr       |
         * | tr      | td       |
         * | *       | div      |
         * ----------------------
         *
         * @property tag
         * @type {String}
         * @default '<parent dependent>'
         */
        this.tag = undefined;

        /**
         * Defines css class name(s) of the view element
         *
         * @property {string}
         * @default undefined
         */
        this.className = undefined;

        /**
         * Sets an id attribute
         *
         * @property {string}
         * @default undefined
         */
        this.id = undefined;

        /**
         * Set the insert mode
         *
         * @property mode
         * @type {String}
         * @default replace
         */
        this.mode = 'replace';

        /**
         * Enable/Disable autoInjection of the view into the DOM
         *
         * @property autoInject
         * @type {Boolean}
         * @default true
         */
        this.autoInject = true;

        /**
         * Holds the domReady state
         *
         * @property __domReady
         * @type {Boolean}
         * @default false
         * @private
         */
        this.__domReady = false;

        /**
         * Registered view events
         * @type {array}
         * @private
         */
        this.__viewEvents = [];

        var self = this;

        if (typeof conf === 'function') {
            conf.call(this, self);
        }
        else {
            XQCore.extend(this, conf);
        }

        /**
         * Set view name
         * @public
         * @type {String}
         */
        this.name = (this.name ? this.name.replace(/View$/, '') : 'Nameless') + 'View';

        this.__createView();

        $(function() {
            if (self.container.length > 0) {
                window.addEventListener('resize', function(e) {
                    self.resize(e);
                }, false);

                log.info('Initialize view ' + this.name, ' with conf:', conf);
                log.info(' ... using Container:', self.container);
            }
            else {
                log.error('Can\'t initialize View, Container not found!', self.container);
            }
        });
    };

    XQCore.extend(View.prototype, new XQCore.Event());

    View.prototype.show = function() {
        this.$el.show();
    };

    View.prototype.hide = function() {
        this.$el.hide();
    };

    View.prototype.renderHTML = function(template, data) {
        log.log('Render html snippet', template, 'with data:', data);
        template = typeof template === 'function' ? template : XQCore.Tmpl.compile(template);
        return template(data);
    };

    View.prototype.resize = function() {

    };

    /**
     * Gets the data of an element
     *
     * @param {Object} selector DOM el or a jQuery selector of the element
     *
     * @return {Object} Returns the data of an element or null
     */
    View.prototype.getElementData = function(selector) {
        var el = $(selector, this.container);
        if (el.length) {
            var data = {},
                attrs = el.get(0).attributes,
                i;

            for (i = 0; i < attrs.length; i++) {
                if (attrs[i].name.indexOf('data-') === 0) {
                    var name = attrs[i].name.substr(5),
                        value = attrs[i].value;

                    if (typeof value === 'string') {
                        try {
                            if (value === 'true' || value === 'TRUE') {
                                value = true;
                            }
                            else if (value === 'false' || value === 'FALSE') {
                                value = false;
                            }
                            else if (value === 'null' || value === 'NULL') {
                                value = null;
                            }
                            else if (value === 'undefined') {
                                value = undefined;
                            }
                            else if (+value + '' === value) {
                                value = +value;
                            }
                            else {
                                value = JSON.parse(value);
                            }
                        }
                        catch(err) {

                        }
                    }

                    data[name] = value;
                }
            }

            return data;
        }
        else {
            return null;
        }
    };

    /**
     * If a validation failed (Automatically called in a coupled view)
     *
     * @method validationFailed
     * @param {Object} err Validation error object
     */
    View.prototype.validationFailed = function(err, data) {
        var self = this;

        err.forEach(function(item) {
            self.$el.find('[name="' + item.property + '"]').addClass('xq-invalid');
        });
    };

    /**
     * To be called when a state.change event from a coupled model was revived
     *
     * @param {String} state Model state
     * @override
     */
    View.prototype.onStateChange = function(state) {
        var classNames = this.el.className.split(' ');
        classNames = classNames.filter(function(cssClass) {
            return !/^xq-state-/.test(cssClass);
        });

        classNames.push('xq-state-' + state);
        this.el.className = classNames.join(' ');
    };

    /**
     * Wait till view is ready
     *
     * @method ready
     * @param {Function} callback Callback
     */
    View.prototype.ready = function(callback) {
        if (this.isReady) {
            callback.call(this);
        }
        else {
            if (!this.__readyCallbacks) {
                this.__readyCallbacks = [];
            }

            this.__readyCallbacks.push(callback);
        }
    };

    View.prototype.__setReadyState = function() {
        var self = this;

        this.isReady = true;
        if (this.__readyCallbacks) {
            this.__readyCallbacks.forEach(function(fn) {
                fn.call(self);
            });
            this.__readyCallbacks = [];
        }
    };

    /**
     * Inject element into the DOM
     *
     * @public
     * @method inject
     */
    View.prototype.inject = function() {
        if (this.el.parentNode === this.ct) {
            return;
        }

        log.info('Inject view into container', this.$ct);

        if (this.mode === 'replace') {
            this.$ct.contents().detach();
            this.$ct.append(this.$el);
        }
        else if (this.mode === 'append') {
            this.$ct.append(this.$el);
        }
        else if (this.mode === 'prepend') {
            this.$ct.prepend(this.$el);
        }
        else {
            throw new Error('Unknown insert mode in view constructor');
        }

    };

    /**
     * Parse a precompiled template and returns a html string
     *
     * @method parse
     *
     * @param {Function} template Precompiled template
     * @param {Object} data Data object
     *
     * @return {String} compiled html
     */
    View.prototype.parse = function(template, data, __scopes) {
        var html,
            $newEl;

        template.scopeStore = {};
        template.scopes = __scopes || {};

        try {
            html = template(data || {}, template.scopes);
        }
        catch(err) {
            html = '<p class="renderError"><b>View render error!</b><br>' + err.message + '</p>';
            this.error('View render error!', err);
        }

        var parseScope = function(html, data, parent) {
            html = $.parseHTML(html);
            var $scopeEl = $(html);
            var els = $scopeEl.find('scope');

            var counter = {};

            els.each(function() {
                var scopeId = $(this).attr('id'),
                    path = $(this).attr('path'),
                    content;

                var dataPath = parent ? parent + '.' + path : path;

                var templateData = data;
                if (Array.isArray(data)) {
                    counter[path] = counter[path] || 0;
                    templateData = data[counter[path]++];
                }

                content = {};
                if (scopeId) {
                    var scopeHTML = template.scopes[scopeId](data[path], data);
                    content.value = scopeHTML ? parseScope(scopeHTML, data[path], dataPath) : document.createTextNode('');
                    content.id = scopeId;
                }
                else {
                    content.value = $.parseHTML(data[path]);
                }

                template.scopeStore[dataPath] = template.scopeStore[dataPath] || [];
                template.scopeStore[dataPath].push(content);

                $(this).replaceWith($(content.value));
            });

            return $scopeEl;
        };

        if (html) {
            $newEl = parseScope(html, data);
        }

        return $newEl;
    };

    /**
     * Render view
     *
     * @method render
     * @emits content.change
     *
     * @param  {Object} data Render data
     *
     */
    View.prototype.render = function(data) {
        if (this.__domReady === false) {
            this.__initialData = data || {};
            return;
        }

        var html;

        log.info('Render view template of view ' + this.name, 'with data:', data);

        var template = typeof this.template === 'function' ? this.template : XQCore.Tmpl.compile(this.template);
        this.scopes = {};

        try {
            html = template(data || {}, this.scopes);
        }
        catch(err) {
            html = '<p class="renderError"><b>View render error!</b><br>' + err.message + '</p>';
            this.error('View render error!', err);
        }

        this.el.innerHTML = html;
        this.emit('content.change', data);
    };

    View.prototype.registerListener = function($el) {
        var self = this;

        $el.find('[on]').addBack('[on]').each(function() {
            var $cur = $(this);
            var events = $(this).attr('on');
            var data = $(this).data();
            var listenerFunc;
            $cur.removeAttr('on');

            events = events.split(';');
            events.forEach(function(ev) {
                ev = ev.split(':');

                if (ev[0] === 'submit') {
                    listenerFunc = function(e) {
                        e.preventDefault();
                        data = self.serializeForm(e.target);
                        data = self.onSubmit(data, e.target);
                        self.emit(ev[1], data, e);
                        // self.presenter.emit(ev[1], data, e);
                    };
                }
                else {
                    listenerFunc = function(e) {
                        e.preventDefault();
                        var value = e.currentTarget.value || '';
                        self.emit(ev[1], value, data, e);
                        // self.presenter.emit(ev[1], value, data, e);
                    };
                }

                $cur.bind(ev[0], listenerFunc);
            });
        });

        //Register DOM listener
        this.__viewEvents.forEach(function(listener) {
            self.$el.delegate(listener.selector, listener.events, listener.callback);
        });
    };

    /**
     * Serialize a form and return its values as JSON
     *
     * @param {Object} Form selector
     * @return {Object} FormData as JSON
     */
    View.prototype.serializeForm = function(selector) {
        var formData = {},
            formSelector = $(selector);

        if (formSelector.get(0).tagName !== 'INPUT') {
            formSelector = formSelector.find(':input');
        }

        formSelector.serializeArray().forEach(function(item) {
            XQCore.dedotify(formData, item.name, item.value);
        });

        log.info('Serialize form of view ' + this.name, 'form selector:', formSelector, 'form data:', formData);

        return formData;
    };

    /**
     * Insert a subset
     * @param  {String} path  Data path
     * @param  {Number} index Index after which item the insert should be happen or use -1 to prepend
     * @param  {Object} data  Item data
     */
    View.prototype.insert = function(path, index, data) {
        var self = this;
        var $scope = this.$el.find('[fire-path="' + path + '"]');
        if ($scope.length) {
            $scope.each(function() {
                var scope = $(this).attr('fire-scope');
                var html = self.scopes[scope]([data]);

                var $childs = $(this).children();
                if (index > -1) {
                    if (index > $childs.length - 1) {
                        index = $childs.length - 1;
                    }

                    $childs.eq(index).before(html);
                }
                else {
                    $childs.eq(index).after(html);
                }
            });
        }
    };

    View.prototype.update = function(path, data) {
        log.warn('XQCore doesn`t support update events yet');
    };

    View.prototype.append = function(path, data) {
        this.insert(path, -1, data);
    };

    View.prototype.prepend = function(path, data) {
        this.insert(path, 0, data);
    };

    /**
     * Remove an item from a subset. Removes the item with the given index.
     * If index is negative number it will be removed from the end
     * 
     * @param  {String} path  data path
     * @param  {Number} index Index of the item
     */
    View.prototype.remove = function(path, index) {
        var $scope = this.$el.find('[fire-path="' + path + '"]');
        $scope.children(':eq(' + index + ')').remove();
    };

    /**
     * Seting up forms
     * It's wating till view is ready
     * @param  {Object} model Coupled model
     * @param  {Object} $el   Form element
     */
    View.prototype.formSetup = function(model, $el) {
        var self = this;

        this.ready(function() {
            var errClassName = 'xq-invalid',
                disabledClass = 'xq-disabled';

            if (!$el) {
                $el = this.$el.find('form');
            }

            var blurHandler = function(e) {
                var $form = $(this).closest('form'),
                    $input = $(this);

                $input.removeClass(errClassName);
                var name = $input.attr('name'),
                    value = $input.val();

                if (name && model.schema && model.schema[name]) {
                    var result = model.validateOne(model.schema[name], value);
                    if (result.isValid) {

                        //Set form valid state
                        if ($form.find(':input[class~="' + errClassName + '"]').length === 0) {
                            $form.removeClass(errClassName);
                            $form.find(':submit').removeAttr('disabled').removeClass(disabledClass);
                        }
                    }
                    else {
                        $input.addClass(errClassName);
                        $form.addClass(errClassName);
                        $form.find(':submit').attr('disabled', 'disabled').addClass(disabledClass);
                    }
                }
            };

            var submitHandler = function(e) {
                e.preventDefault();
                var data = self.serializeForm(e.target);
                self.emit('form.submit', data);
            };

            this.addEvent(':input', 'blur', blurHandler);
            this.addEvent('form', 'submit', submitHandler);
        });
    };

    /**
     * Called on submiting a form. 
     * 
     * @method onSubmit
     * @param {Object} data Form data
     * @param {Object} $form jQuery selector of the submited form
     * @returns {Object} Changed form data
     */
    View.prototype.onSubmit = function(data, $form) {
        return data;
    };

    /**
     * Removes a view from dom and unregisters all its listener
     * @return {[type]} [description]
     */
    View.prototype.destroy = function() {
        this.$el.remove();
        this.removeAllListeners();
        if (this.__coupledWith) {
            for (var i = 0, len = this.__coupledWith.length; i < len; i++) {
                var coupledObj = this.__coupledWith[i];
                if (coupledObj._events) {
                    for (var ev in coupledObj._events) {
                        if (coupledObj._events[ev]) {
                            var eventName = ev;
                            for (var j = 0, len2 = coupledObj._events[ev].length; j < len2; j++) {
                                if (coupledObj._events[ev][j].listener.fnType === 'coupled-model-listener' && coupledObj._events[ev][j].listener.fnParent === this) {
                                    coupledObj.removeEvent(eventName, coupledObj._events[ev][j].listener);
                                }
                            }
                        }
                    }

                }
            }
        }

        log.info('View ' + this.name + ' has been destroyed');
    };

    /**
     * Register a DOM event listerner for a given element. The DOM element mustnt exists at this time. (Using jQuery.deleget() on the this.$el element)
     * @param {String}   selector A selector to the item that should trigger the event
     * @param {String}   events   A string of on ore more Javascript event handler. Use a space separated list for mor then one event. E.g: 'click mousedown'
     * @param {Function} callback Callback function to be called when event is triggered
     */
    View.prototype.addEvent = function(selector, events, callback) {
        this.__viewEvents.push({
            events: events,
            selector: selector,
            callback: callback
        });

        if (this.$el) {
            this.$el.delegate(selector, events, callback);
        }
    };


    /**
     * Defines a container -> view tag type mapping
     * 
     * @private true
     * @type {Object}
     */
    View.prototype.__viewTagTypes = {
        '*': 'div',
        'body': 'section',
        'section': 'section',
        'ul': 'li',
        'table': 'tbody',
        'tbody': 'tr',
        'tr': 'td'
    };

    /**
     * Creates new view element, based on *tag* option
     * 
     * @private true
     * @return {object} Returns a DOM element
     */
    View.prototype.__createViewElement = function() {
        if (this.tag) {
            return document.createElement(this.tag);
        }

        var parentTag = this.ct ? this.ct.tagName.toLowerCase() : '*',
            viewTag = this.__viewTagTypes['*'];

        if (this.__viewTagTypes[parentTag]) {
            viewTag = this.__viewTagTypes[parentTag];
        }

        return document.createElement(viewTag);
    };

    /**
     * Creates a view and registers event listeners as soon as DOM is ready.
     *
     * @private true
     */
    View.prototype.__createView = function() {
        var self = this,
            classNames = [];

        $(function() {
            //Create view element
            self.$ct = self.$ct || $(self.container);
            self.ct = self.$ct.get(0);
            
            self.el = self.__createViewElement();
            self.$el = $(self.el);
            classNames.push('xq-view xq-' + self.name.replace(/View$/, '-view').toLowerCase());

            if (self.id) {
                self.el.setAttribute('id', self.id);
            }

            if (self.className) {
                classNames.push(self.className);
            }
            
            if (self.hidden === true) {
                classNames.push('xq-hidden');
                self.$el.hide();
            }

            self.el.className = classNames.join(' ');

            //Set DOM ready state
            self.__domReady = true;
            if (self.__initialData) {
                self.render(self.__initialData);
                delete self.__initialData;
            }

            if (self.autoInject) {
                self.inject();
            }

            //Set ready state
            self.__setReadyState();
            self.registerListener(self.$el);
        });
    };

    XQCore.View = View;

})(XQCore);

/**
 * Extends XQCore with some usefull functions
 */
(function(XQCore, undefined) {
	'use strict';

	XQCore.undotify = function(path, obj) {
		if(path) {
			path = path.split('.');
			path.forEach(function(key) {
				obj = obj ? obj[key] : undefined;
			});
		}

		return obj;
	};

	/**
	 * Creates a object from an dotified key and a value
	 *
	 * @public
	 * @method dedotify
	 * 
	 * @param {Object} obj Add new value to obj. This param is optional.
	 * @param {String} key The dotified key
	 * @param {Any} value The value
	 *
	 * @returns {Object} Returns the extended object if obj was set otherwis a new object will be returned
	 */
	XQCore.dedotify = function(obj, key, value) {

		if (typeof obj === 'string') {
			value = key;
			key = obj;
			obj = {};
		}

		var newObj = obj;

		if(key) {
			key = key.split('.');
			var len = key.length;
			key.forEach(function(k, i) {
				if (i === len - 1) {
					if (/\[\]$/.test(k)) {
						k = k.substr(0, k.length - 2);
						if (!obj[k]) {
							obj[k] = [];
						}
						obj[k].push(value);
						return;
					}

					obj[k] = value;
					return;
				}

				if (!obj[k]) {
					obj[k] = {};
				}

				obj = obj[k];
			});
		}

		obj = value;

		return newObj;
	};

})(XQCore);
/*jshint -W014 */
/**
 * XQCore Router API
 *
 * @author Andi Heinkelein - noname-media.com
 * @copyright Andi Heinkelein - noname-media.com
 * @package XQCore
 *
 * Based on router.js v0.2.0
 * Copyright Aaron Blohowiak and TJ Holowaychuk 2011.
 * https://github.com/aaronblohowiak/routes.js
 */
(function(XQCore, undefined) {
	'use strict';

	/**
	 * Convert path to route object
	 *
	 * A string or RegExp should be passed,
	 * will return { re, src, keys} obj
	 *
	 * @param  {String / RegExp} path
	 * @return {Object}
	 */
	var Route = function(path) {
		//using 'new' is optional
		
		var src, re, keys = [];
		
		if (path instanceof RegExp) {
			re = path;
			src = path.toString();
		} else {
			re = pathToRegExp(path, keys);
			src = path;
		}

		return {
			re: re,
			src: path.toString(),
			keys: keys
		};
	};

	/**
	 * Normalize the given path string,
	 * returning a regular expression.
	 *
	 * An empty array should be passed,
	 * which will contain the placeholder
	 * key names. For example "/user/:id" will
	 * then contain ["id"].
	 *
	 * @param  {String} path
	 * @param  {Array} keys
	 * @return {RegExp}
	 */
	var pathToRegExp = function (path, keys) {
		path = path
			.concat('/?')
			.replace(/\/\(/g, '(?:/')
			.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
				keys.push(key);
				slash = slash || '';
				return ''
					+ (optional ? '' : slash)
					+ '(?:'
					+ (optional ? slash : '')
					+ (format || '') + (capture || '([^/]+?)') + ')'
					+ (optional || '');
			})
			.replace(/([\/.])/g, '\\$1')
			.replace(/\*/g, '(.+)');
		return new RegExp('^' + path + '$', 'i');
	};

	/**
	 * Attempt to match the given request to
	 * one of the routes. When successful
	 * a  {fn, params, splats} obj is returned
	 *
	 * @param  {Array} routes
	 * @param  {String} uri
	 * @return {Object}
	 */
	var match = function (routes, uri) {
		var captures, i = 0;

		for (var len = routes.length; i < len; ++i) {
			var route = routes[i],
				re = route.re,
				keys = route.keys,
				splats = [],
				params = {},
				j;

			captures = re.exec(uri);
			if (captures) {
				for (j = 1, len = captures.length; j < len; ++j) {
					var key = keys[j-1],
						val = typeof captures[j] === 'string'
							? decodeURIComponent(captures[j])
							: captures[j];
					if (key) {
						params[key] = val;
					} else {
						splats.push(val);
					}
				}

				return {
					params: params,
					splats: splats,
					route: route.src
				};
			}
		}
	};

	/**
	 * Default "normal" router constructor.
	 * accepts path, fn tuples via addRoute
	 * returns {fn, params, splats, route}
	 *  via match
	 *
	 * @return {Object}
	 */
	// var getRouter = function() {
	//   //using 'new' is optional
	//   return {
	//     routes: [],
	//     routeMap : {},
	//     addRoute: function(path, fn) {
	//       if (!path) {
	//         throw new Error(' route requires a path');
	//       }

	//       if (!fn) {
	//        throw new Error(' route ' + path.toString() + ' requires a callback');
	//       }

	//       var route = new Route(path);
	//       route.fn = fn;

	//       this.routes.push(route);
	//       this.routeMap[path] = fn;
	//     },

	//     match: function(pathname) {
	//       var route = match(this.routes, pathname);
	//       if(route){
	//         route.fn = this.routeMap[route.route];
	//       }
	//       return route;
	//     }
	//   };
	// };

	var Router = function(conf) {
		conf = XQCore.extend({
			debug: false
		}, conf);

		this.debug = Boolean(conf.debug);

		this.routes = [];
		this.routeMap = {};
	};

	Router.prototype.addRoute = function(path, fn) {
		if (!path) {
			throw new Error(' route requires a path');
		}

		if (!fn) {
			throw new Error(' route ' + path.toString() + ' requires a callback');
		}

		var route = new Route(path);
		route.fn = fn;

		this.routes.push(route);
		this.routeMap[path] = fn;
	};

	Router.prototype.match = function(pathname) {
		var route = match(this.routes, pathname);
		if(route){
			route.fn = this.routeMap[route.route];
		}
		return route;
	};

	/**
	 * Fires a give route
	 *
	 * @param  {String} route	The route to fire
	 * @param  {Object}	data	Callback data
	 *
	 * @return {Boolean}       Returns the matched route
	 */
	Router.prototype.fire = function(route, data) {
		route = this.match(route);
		if (route) {
			route.fn(data);
		}
	};

	XQCore.Router = Router;

})(XQCore);
/**
 * XQCore socket module handles socket connections to a socket server
 * @module XQCore.Socket
 * @requires XQCore.Logger
 * @requires sockJS-client
 *
 */
(function(XQCore, undefined) {
    'use strict';

    var log = new XQCore.Logger('Socket');

    var SockJS = XQCore.require('sockjs');

    var Socket = function() {
        this.__isReady = false;
        this.__onReadyCallbacks = [];
        this.__eventEmitter = new XQCore.Event();
    };

    XQCore.extend(Socket.prototype);

    /**
     * Connects to a socket server
     *
     * @method connect
     * @param {String}   url      Socket server url
     * @param {Object}   options  SockJS options
     * @param {Function} callback Callback function. Its called if connection was successful and its called before ready state becomes true
     * @example {js}
     * var socket = new XQCore.Socket();
     * socket.connect('http://mysocket.io:9889');
     * socket.on('data', function() {
     *   console.log('Got data from server');
     * });
     * 
     */
    Socket.prototype.connect = function(url, options, callback) {
        var self = this;


        log.req('Connect to socket server ', url, 'using options:', options);
        this.sockJS = new SockJS(url, null, options);

        this.sockJS.onopen = function() {
            log.req('Connection was successful!');
            if (typeof callback === 'function') {
                callback();
            }

            self.setReady();
        };

        this.sockJS.onmessage = function(e) {
            var msg;

            try {
                msg = JSON.parse(e.data);
            }
            catch(err) {
                console.error('Could not parse socket message!', e.data);
            }

            log.log('Got message', msg.eventName, 'with args:', msg.args);
            var args = msg.args || [];
            args.unshift(msg.eventName);
            self.__eventEmitter.emit.apply(self.__eventEmitter, args);
        };

        this.sockJS.onclose = function() {
            log.log('Connection closed!');
        };
    };

    /**
     * Sends a socket message to a connected socket server
     *
     * @method emit
     * @param {String} eventName Event name
     * @param {Object} data      Data
     * 
     */
    Socket.prototype.emit = function(eventName, data) {
        var self = this;

        var args = Array.prototype.slice.call(arguments, 1);

        this.ready(function() {
            log.log('Send message ', eventName, args);
            self.sockJS.send(JSON.stringify({
                eventName: eventName,
                args: args
            }));
        });
    };

    /**
     * Registers a listener for an incoming socket message
     *
     * @method  on
     * @param {String}   eventName Event name
     * @param {Function} callback  Listener callback
     */
    Socket.prototype.on = function(eventName, callback) {
        this.__eventEmitter.on(eventName, callback);
    };


    /**
     * Registers a once-listener for an incoming socket message.
     * This listener will be removed if a socet message with the same name has been arrived.
     *
     * @method  once
     * @param  {String}   eventName Event name
     * @param  {Function} callback  Listener callback
     */
    Socket.prototype.once = function(eventName, callback) {
        this.__eventEmitter.once(eventName, callback);
    };

    /**
     * Unregisters a socket listener
     *
     * @method off
     * @param  {String}   eventName Event name
     * @param  {Function} callback  Listener callback (Optional)
     */
    Socket.prototype.off = function(eventName, callback) {
        this.__eventEmitter.off(eventName, callback);
    };

    /**
     * Call function fn when socket is connected
     *
     * @method ready
     * @param  {Function} fn Function to be called if socket is ready
     */
    Socket.prototype.ready = function(fn) {
        if (this.__isReady) {
            fn.call(this);
        }
        else {
            this.__onReadyCallbacks.push(fn);
        }
    };

    /**
     * Sets readyState and calls all queued functions
     *
     * @method setReady
     * @private
     */
    Socket.prototype.setReady = function() {
        var self = this;
        
        this.__isReady = true;
        this.__onReadyCallbacks.forEach(function(fn) {
            fn.call(self);
        });

        this.__onReadyCallbacks = [];
    };

    XQCore.Socket = Socket;

})(XQCore);
/**
 *	@requires XQCore.Model
 *	@requires XQCore.Socket
 */
(function(XQCore, undefined) {
	'use strict';
	var SyncModel;

	SyncModel = function(name, conf) {
		//Call XQCore.Model constructor
		XQCore.Model.call(this, name, conf);

		conf = conf || {};

		this.server = conf.server || location.protocol + '//' + location.hostname;
		this.port = conf.port || XQCore.socketPort;
		this.path = conf.path || 'xqsocket/' + name;
		this.syncEnabled = false;
	};

	SyncModel.prototype = Object.create(XQCore.Model.prototype);
	SyncModel.prototype.constructor = SyncModel;

	SyncModel.prototype.init = function() {
		//Call XQCore.Model constructor
		XQCore.Model.prototype.init.call(this);

		this.connectToSocket();
	};

	/**
	 * Connect to a socket server
	 *
	 * @method connectToSocket
	 */
	SyncModel.prototype.connectToSocket = function() {
		var socketServer = this.server + ':' + this.port + '/' + this.path;
		if (!this.socket) {
			this.socket = new XQCore.Socket();
			this.socket.connect(socketServer);
		}
	};

	SyncModel.prototype.register = function(enableSync) {
		var self = this,
			modelName = this.conf.syncWith || this.name.replace(/Model$/,'');

		this.syncEnabled = !!enableSync;

		console.log('register model at server');
		this.socket.emit('syncmodel.register', {
			name: modelName
		});

		this.socket.on('syncmodel.change', function(data) {
			var opts = {
				noSync: true
			};

			var args = data.slice(1);
			args.push(opts);

			switch (data[0]) {
				case 'replace':
				case 'item':
					self.set.apply(self, args);
					break;
				case 'append':
					self.append.apply(self, args);
					break;
				case 'prepend':
					self.prepend.apply(self, args);
					break;
				case 'insert':
					self.insert.apply(self, args);
					break;
				case 'remove':
					self.remove.apply(self, args);
					break;

				default:
					self.warn('Unknown syncmodel event', data[0]);
			}
		});
	};

	SyncModel.prototype.unregister = function() {
		var modelName = this.conf.syncWith || this.name.replace(/Model$/,'');
		this.socket.emit('syncmodel.unregister', {
			name: modelName
		});

		this.socket.off('syncmodel.change');
	};

	/**
	 * Send a socket emit to the server
	 * @param  {String} eventName Event name
	 * @param  {Object} data      Data object
	 */
	SyncModel.prototype.emitRemote = function(eventName, data) {
		this.socket.emit(eventName, data);
	};

	SyncModel.prototype.sync = function() {
		if (!this.syncEnabled) {
			return;
		}

		var args = Array.prototype.slice.call(arguments);
		this.emitRemote('syncmodel.change', args);
	};

	XQCore.SyncModel = SyncModel;
})(XQCore);
/**
 * XQCore List
 *  
 * @module  XQCore.List
 * @requires XQCore.Event
 * @requires XQCore.Logger
 * @example
 * 
 * var Model = XQCore.Model.inherit({
 *     schema: {
 *         title: { type: 'string', min: 3, max 100 },
 *         content: { type: 'string', min: 3, max 1000 }
 *     }
 * });
 * 
 * var list new XQCore.List('myList', function(self) { {
 *     self.model = Model
 * }});
 *
 * list.push({
 *     title: 'Item 1',
 *     content: 'This is my first list item'
 * });
 * 
 */
(function(XQCore, undefined) {
    'use strict';

    var List;

    /**
     * XQCore.List base class
     *
     * @class XQCore.List
     * @constructor
     *
     * @uses XQCore.Logger
     * @uses XQCore.Event
     *
     * @param {Object} conf List extend object
     */
    List = function(name, conf) {
        var self = this;

        if (typeof arguments[0] === 'object') {
            conf = name;
            name = conf.name;
        }

        /**
         * Enable debug mode
         * @public
         * @type {Boolean}
         */
        this.debug = XQCore.debug;

        if (conf === undefined) {
            conf = {};
        }

        this.__unfiltered = {};

        this.name = (name ? name.replace(/List$/, '') : 'Nameless') + 'List';

        /**
         * Contains list items
         * @property {Array} items
         */
        this.items = [];

        /**
         * Sets the Model to be used to create new models in push and unshift methods.

         * @property {Object} model
         */
        if (!this.model) {
            this.model = XQCore.Model;
        }

        if (typeof conf === 'function') {
            conf.call(this, self);
        }
        else {
            XQCore.extend(this, conf);
        }
        
        this.state('ready');
    };


    XQCore.extend(List.prototype, new XQCore.Event(), new XQCore.Logger());

    /**
     * Contains the length of the list
     * @property length
     * @type {Number}
     */
    Object.defineProperty(List.prototype, 'length', {
        get: function() {
            return this.items.length;
        }
    });

    /**
     * Change the list state
     *
     * @method state
     * @param {String} state New state
     */
    List.prototype.state = function(state) {
        this.__state = state;
        this.emit('state.' + state);
        this.emit('state.change', state);
    };

    /**
     * Get the current list state
     *
     * @method getState
     */
    List.prototype.getState = function() {
        return this.__state;
    };

    /**
     * Adds one ore more items to the end of a list.
     * You can pass a XQCore.Model or a plain data object.
     * A data object will be converted into a XQCore.Model.
     * The model must be valid to be added to the list.
     * 
     * @param {Object|Array} data Model instance or a plain data object. Add multiple models by using an array of items
     * @param {Object} options Options object
     * {
     *     silent: true,    //Disable event emitting
     *     noSync: true     //Don't call sync method
     * }
     *
     * @returns {Boolean} Returns true if validation was succesfully and all items were added
     */
    List.prototype.push = function(data, options) {
        var models = [],
            model,
            item;

        options = options || {};

        if (!Array.isArray(data)) {
            data = [data];
        }

        for (var i = 0, len = data.length; i < len; i++) {
            item = data[i];
        
            if (item instanceof XQCore.Model) {
                model = item;
            }
            else {
                model = new this.model('ListItem');
                model.set(item);
            }

            if (model.isValid()) {
                models.push(model);
            }
            else {
                return false;
            }
        }

        //No validation error has been ocured.
        var length = this.items.push.apply(this.items, models);

        if (this.maxLength && this.items.length > this.maxLength) {
            this.items.splice(0, this.items.length - this.maxLength);
        }

        if (!options.silent) {
            this.emit('item.push', length - models.length, models.length);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('push', models);
            }
        }

        return true;
    };

    /**
     * Adds one ore more items to the beginning of a list.
     * You can pass a XQCore.Model or a plain data object.
     * A data object will be converted into a XQCore.Model.
     * The model must be valid to be added to the list.
     * 
     * @param {Object|Array} data Model instance or a plain data object. Add multiple models by using an array of items
     * @param {Object} options Options object
     * {
     *     silent: true,    //Disable event emitting
     *     noSync: true     //Don't call sync method
     * }
     * @returns {Boolean} Returns true if validation was succesfully and all items were added
     */
    List.prototype.unshift = function(data, options) {
        var models = [],
            model,
            item;

        options = options || {};

        if (!Array.isArray(data)) {
            data = [data];
        }

        for (var i = 0, len = data.length; i < len; i++) {
            item = data[i];
        
            if (item instanceof XQCore.Model) {
                model = item;
            }
            else {
                model = new this.model('ListItem');
                model.set(item);
            }

            if (model.isValid()) {
                models.unshift(model);
            }
            else {
                return false;
            }
        }

        //No validation error has been ocured.
        var length = this.items.unshift.apply(this.items, models);

        if (!options.silent) {
            this.emit('item.unshift', length - models.length, models.length);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('unshift', models);
            }
        }

        return true;
    };

    /**
     * Removes the last item from a list and returns it.
     *
     * @event item.remove Emits an item.remove event. The removed item will be passed as the first argument
     * 
     * @param {Object} options Options object
     * {
     *     silent: true,    //Disable event emitting
     *     noSync: true     //Don't call sync method
     * }
     *
     * @returns {Object} Returns the removed item
     */
    List.prototype.pop = function(options) {
        var model;

        options = options || {};

        model = this.items.pop() || null;
        if (model === undefined) {
            return null;
        }

        if (!options.silent) {
            this.emit('item.pop', model);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('pop', model);
            }
        }

        return model;
    };

    /**
     * Removes the first item from a list and returns it.
     *
     * @event item.shift Emits an item.shift event. The removed item will be passed as the first argument
     * 
     * @param {Object} options Options object
     * {
     *     silent: true,    //Disable event emitting
     *     noSync: true     //Don't call sync method
     * }
     *
     * @returns {Object} Returns the removed item
     */
    List.prototype.shift = function(options) {
        var model;

        options = options || {};

        model = this.items.shift() || null;
        if (model === undefined) {
            return null;
        }

        if (!options.silent) {
            this.emit('item.shift', model);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('shift', model);
            }
        }

        return model;
    };

    /**
     * Updates a list item or pushs it to the end
     * You can pass a XQCore.Model or a plain data object.
     * A data object will be converted into a XQCore.Model.
     * The model must be valid to be added to the list.
     * 
     * @param {Object|Array} data Model instance or a plain data object. Add multiple models by using an array of items
     * @param {Object} options Options object
     * {
     *     silent: true,    //Disable event emitting
     *     noSync: true     //Don't call sync method
     * }
     *
     * @fires item.update
     * Fires an item.update event if item was succesfully updated. Othwewise fires an item.push event
     *
     * @returns {Boolean} Returns true if validation was succesfully and all items were added
     */
    List.prototype.update = function(select, data, options) {
        var models = [],
            model,
            item,
            self = this;

        options = options || {};

        if (!Array.isArray(data)) {
            data = [data];
        }

        for (var i = 0, len = data.length; i < len; i++) {
            item = data[i];
        
            if (item instanceof XQCore.Model) {
                model = item;
            }
            else {
                model = new this.model('ListItem');
                model.set(item);
            }

            if (model.isValid()) {
                models.push(model);
            }
            else {
                return false;
            }
        }

        //No validation error has been ocured.
        var keys = Object.keys(select);

        console.log('KEYS', keys);

        models.forEach(function(newItem) {
            newItem = newItem.properties;
            console.log('NEW', newItem);
            var query = {};
            keys.forEach(function(key) {
                query[key] = newItem[key];
            });

            console.log('QUERY', query);
            var res = self.findOne(query);
            if (res) {
                res.set(newItem);
             
                if (!options.silent) {
                    self.emit('item.update', select, newItem);
                }

                if (!options.noSync) {
                    if (typeof self.sync === 'function') {
                        self.sync('update', select, newItem);
                    }
                }
            }
            else {
                self.push(newItem);
            }
        });

        return true;
    };

    List.prototype.toArray = function() {
        return this.items.map(function(model) {
            return model.properties;
        });
    };

    /**
     * Search through list items and returns the first matching item
     *
     * @method findOne
     * @param {Object} searchfor Searching for object
     * @return {Object} Returns the first matched item or null. The returning item is a XQCore.Model object
     */
    List.prototype.findOne = function(query) {
        var parent;

        parent = this.items;
        
        if (parent) {
            for (var i = 0; i < parent.length; i++) {
                var prop = parent[i],
                    matching;

                for (var p in query) {
                    if (query.hasOwnProperty(p)) {
                        if (prop.properties[p] && prop.properties[p] === query[p]) {
                            matching = true;
                            break;
                        }
                        else {
                            matching = false;
                        }
                    }
                }

                if (matching === true) {
                    return prop;
                }

            }
        }

        return null;
    };

    /**
     * Search through list items and returns all matching items
     *
     * @method find
     * @param {Object} searchfor Searching for object
     * @return {Object} Returns all matched item or an empty array.
     * The returning value is an array of XQCore.Model objects
     */
    List.prototype.find = function(query) {
        var parent,
            res = [];

        parent = this.items;
        
        if (parent) {
            for (var i = 0; i < parent.length; i++) {
                var prop = parent[i],
                    matching;

                for (var p in query) {
                    if (query.hasOwnProperty(p)) {
                        if (prop.properties[p] && prop.properties[p] === query[p]) {
                            matching = true;
                            break;
                        }
                        else {
                            matching = false;
                        }
                    }
                }

                if (matching === true) {
                    res.push(prop);
                }

            }
        }

        return res;
    };

    List.prototype.each = function(initial, fn) {
        if (typeof initial === 'function') {
            fn = initial;
            initial = null;
        }

        var data = initial;
        for (var i = 0, len = this.items.length; i < len; i++) {
            data = fn(data, this.items[i].properties);
        }

        return data;
    };

    /**
     * Create module
     */
    XQCore.List = List;
})(XQCore);

/**
 * XQCore.SyncList - Syncronized list
 * 
 * @requires XQCore.List
 * @requires XQCore.Socket
 *
 * @example
 *
 * var syncList = new XQCore.SyncList('mylist', {
 *     port: 3434,
 *     server: 'http://socket.xqcore.com'
 * });
 *
 * This call connects to a socket server
 * http://socket.xqcore.com/xqsocket/mylist
 *
 * A <code>synclist.register</code> event will be fiered to the socket server
 * These data will be send:
 * <code class="json">
 * {
 *     name: this.name
 * }
 *
 * Registers a few listeners:
 * synclist.push, synclist.shift, synclist.pop, synclist.unshift
 * 
 * </code>
 */
(function(XQCore, undefined) {
    'use strict';
    var SyncList;

    
    SyncList = function(name, conf) {
        /**
         * @property {Boolean} noAutoRegister Disables auto registration. SyncList.register() must be called manually to register the list at the socket server.
         */
        this.noAutoRegister = false;

        //Call XQCore.List constructor
        XQCore.List.call(this, name, conf);

        this.server = this.server || location.protocol + '//' + location.hostname;
        this.port = this.port || XQCore.socketPort;
        this.path = this.path || 'xqsocket/' + this.name.toLowerCase();
        this.syncEnabled = false;
        this.connectToSocket();
        if (!this.noAutoRegister) {
            this.register();
        }
    };

    SyncList.prototype = Object.create(XQCore.List.prototype);
    SyncList.prototype.constructor = SyncList;

    /**
     * Connect to a socket server
     *
     * @method connectToSocket
     */
    SyncList.prototype.connectToSocket = function() {
        var socketServer = this.server + ':' + this.port + '/' + this.path;
        if (!this.socket) {
            this.socket = new XQCore.Socket();
            this.socket.connect(socketServer);
        }
    };

    /**
     * Register a sync list at the socket server. This action is called automatically except the noAutoRegister option is set.
     * @param  {Boolean} enableSync Enables/Disables the initial sync. Defaults to false
     */
    SyncList.prototype.register = function(enableSync) {
        var self = this;
        if (typeof enableSync === 'boolean') {
            this.syncEnabled = enableSync;
        }

        console.log('Register synclist listener');
        self.dev('Register synclist at server:', self.name);

        var opts = {
            noSync: true
        };
        
        self.socket.on('synclist.push', function(data) {
            self.push(data, opts);
        });
        
        self.socket.on('synclist.unshift', function(data) {
            self.push(data, opts);
        });
        
        self.socket.on('synclist.pop', function() {
            self.push(opts);
        });
        
        self.socket.on('synclist.shift', function() {
            self.push(opts);
        });
        
        self.socket.on('synclist.update', function(query, data) {
            self.update(query, data, opts);
        });
        
        self.socket.on('synclist.init', function(data) {
            console.log('Got initial data:', data);
            self.push(data, opts);
        });

        self.socket.emit('synclist.register', {
            name: self.name
        });
    };

    SyncList.prototype.unregister = function() {
        this.dev('Unregister synclist at server:', this.name);
        this.socket.emit('synclist.unregister', {
            name: this.name
        });

        this.socket.off('synclist.push');
        this.socket.off('synclist.unshift');
        this.socket.off('synclist.pop');
        this.socket.off('synclist.shift');
        this.socket.off('synclist.update');
    };

    /**
     * Send a socket emit to the server
     * @param  {String} eventName Event name
     * @param  {Object} data      Data object
     */
    SyncList.prototype.emitRemote = function(eventName, data) {
        this.socket.emit(eventName, data);
    };

    SyncList.prototype.sync = function() {
        if (!this.syncEnabled) {
            return;
        }

        var args = Array.prototype.slice.call(arguments);
        this.emitRemote('syncmodel.change', args);
    };

    SyncList.prototype.fetchList = function() {
        this.emitRemote('synclist.fetch');
    };

    XQCore.SyncList = SyncList;
})(XQCore);
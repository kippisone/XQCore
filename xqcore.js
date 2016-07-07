(function (root, factory) {
    /*global define:false */

    if (typeof define === 'function' && define.amd) {
        define('XQCore', ['jquery', 'firetpl', 'sockjs-client'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('jquery'), require('firetpl'), require('sockjs-client'));
    } else {
        root.XQCore = factory(window.jQuery, window.FireTPL, window.SockJS);
    }
}(this, function () {
    // 'use strict';

    var deps = ['jquery', 'firetpl', 'sockjs'],
        args = Array.prototype.slice.call(arguments);

    var lastCache;
    var require = function(file) {

        if (deps.indexOf(file) !== -1) {
            return args[deps.indexOf(file)];
        }

        if (require.alias && require.alias[file]) {
            file = require.alias[file];
        }

        file = require.resolve(file, this ? this.file : null);

        var module = {
            exports: {},
            file: file
        };

        lastCache = require.cache;
        if (require.cache[file]) {

            if (require.cache[file].obj) {
                return require.cache[file].obj;
            }

            require.cache[file].fn(module, module.exports, require.bind(module));
            require.cache[file].obj = module.exports || {};
            return require.cache[file].obj;
        }
        else {
            throw new Error('Module ' + file + ' not found!');
        }
    };

    require.resolve = function(path, parent) {
        parent = parent || '';

        var resolved = [];
        if (path.charAt(0) === '.') {
            var newPath = parent;
            newPath = newPath.split('/');
            newPath.pop();
            newPath = newPath.concat(path.split('/'));

            newPath.forEach(function(p) {
                if (p === '..') {
                    resolved.pop();
                    return;
                }
                else if (p === '.' || p === '') {
                    return;
                }

                resolved.push(p);
            });

            if (!parent ||parent.charAt(0) === '.') {
                resolved.unshift('.');
            }
        }
        else {
            return path;
        }

        resolved = resolved.join('/');
        if (!/\.js(on)?$/.test(resolved)) {
            resolved += '.js';
        }

        return resolved;
    };

    require.register = function(alias, path, fn) {
        if (arguments.length === 2) {
            fn = path;
            path = alias;
            alias= null;
        }

        require.cache[path] = {fn: fn, calls: 0};
        if (alias) {
            require.alias[alias] = path;
        }
    };

    require.cache = {};
    require.alias = {};

require.register('./xqcore-init.js', function(module, exports, require) { var XQCore = require('./src/xqcore-core');
XQCore.Promise = require('./src/xqcore-promise');
XQCore.Logger = require('./src/xqcore-logger');
XQCore.ReadyState = require('./src/xqcore-readystate');
XQCore.Event = require('./src/xqcore-event');
XQCore.Sync = require('./src/xqcore-sync');
XQCore.List = require('./src/xqcore-list');
XQCore.Model = require('./src/xqcore-model');
XQCore.Presenter = require('./src/xqcore-presenter');
XQCore.Router = require('./src/xqcore-router');
XQCore.Service = require('./src/xqcore-service');
XQCore.SocketConnection = require('./src/xqcore-socket-connection');
XQCore.Socket = require('./src/xqcore-socket');
XQCore.SyncList = require('./src/xqcore-synclist');
XQCore.SyncModel = require('./src/xqcore-syncmodel');
XQCore.Tmpl = require('./src/xqcore-tmpl');
XQCore.View = require('./src/xqcore-view');
XQCore.Component = require('./src/xqcore-component');

require('./src/xqcore-utils');

module.exports = XQCore;

});
require.register('./src/xqcore-core.js', function(module, exports, require) { 'use strict';

/**
 * XQCore core module
 * @module XQCore
 */

var $ = require('jquery');

/**
 * XQCore main object
 *
 * @package XQcore
 * @type {Object}
 */
var XQCore = {
    /**
     * Contains the current XQCore version
     * @property {String} version
     */
    version: '0.13.1',

    /**
     * Defines a default route
     * @property {String} defaultRoute
     */
    defaultRoute: '/',

    /**
     * Enables html5 routing support
     * @property {Boolean} html5Routes
     * @default false
     */
    html5Routes: false,

    /**
     * Defines a base path of your projewt
     * @type {String}
     */
    basePath: '',

    /**
     * Sets a hashbang for routing. This value is added to each route if html5Routes is set to false
     * @property {String} hashBang
     */
    hashBang: '#!',

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
    socketPort: 9889,

    /**
     * Sets max length of event listener
     * @property {Number} eventListenerMaxLength
     * @default  1328
     */
    eventListenerMaxLength: 1328
};


/**
 * Merges the properties from one or more objects together into a target object
 * Its simply an alias for jQuery.extend.
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
Object.defineProperty(XQCore, 'extend', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert first argument to object');
        }

        var to = Object(target);
        for (var i = 1; i < arguments.length; i++) {
            var nextSource = arguments[i];
            if (nextSource === undefined || nextSource === null) {
                continue;
            }

            nextSource = Object(nextSource);

            var keysArray = Object.keys(nextSource);
            for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                var nextKey = keysArray[nextIndex];
                var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                if (desc !== undefined && desc.enumerable) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }

        return to;
    }
});

/**
 * Checks whether an value is a plain object
 *
 * Tests if an value is an object and was declared with `{}` and it hasn't any prototyped properties
 *
 * @method isPlainObject
 *
 * @param {Object} obj The value which should be checked
 * @returns {Boolean} Returns true if value is a function, otherwise returns false
 */
XQCore.isPlainObject = function(obj) {

};


/**
 * Checks whether an value is a function
 * @method isPlainObject
 *
 * @param {Object} obj The value which should be checked
 * @returns {Boolean} Returns true if value is a plain object, otherwise returns false
 */
XQCore.isFunction = $.isFunction;

/**
 * Checks for a valid ObjectId
 *
 * The pattern of an objectId can be overwritten by setting the XQCore.objectIdPattern property
 *
 * @return {Boolean} Returns true if value is an valid objectId
 */
XQCore.isObjectId = function(value) {
    return (/^[a-zA-Z0-9]{24}$/).test(value);
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
 * Defines a global log level
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

/**
 * Returns one or all queries
 * Converts all numeric items to a Number
 *
 * @method getQuery
 * @param  {String} name Query name
 * @return {Object|String}      Returns all queries or one value.
 */
XQCore.getQuery = function(name) {
    if (!XQCore.__query) {
        XQCore.__query = {};
        location.search.substr(1).split('&').forEach(function(q) {
            q = q.split('=');
            if (q && q[0]) {
                var val = encodeURI(q[1]);
                XQCore.__query[q[0]] = (isNaN(val) ? val : Number(val));
            }
        });
    }

    if (name) {
        return XQCore.__query[name];
    }
    else {
        return XQCore.__query;
    }
};

/**
 * Checks whether an object is an empty object
 * @param  {Object}  obj Object which should be checked
 * @return {Boolean}     Returns true if object is empty
 */
XQCore.isEmptyObject = function(obj) {
    var name;
    //jshint forin:false
    for (name in obj) {
        return false;
    }
    return true;
};

/**
 * Checks whether an object is an empty object or an empty array
 * @param  {Object|Array}  obj Object which should be checked
 * @return {Boolean}     Returns true if obj is empty
 */
XQCore.isEmpty = function(obj) {
    if (Array.isArray(obj)) {
        return obj.length === 0;
    }

    return XQCore.isEmptyObject(obj);
};

//--

module.exports = XQCore;

});
require.register('./src/xqcore-promise.js', function(module, exports, require) { 'use strict';

// var callAll = function(fnStack, data, done) {
//   var next = function() {
//     var nextFn = fnStack.unshift();
//     if (!nextFn) {
//       done();
//     }
//     else {
//       next();
//     }
//   };

//   next();
// };

var Promise = function(fn) {
  this._fullFillFuncs = [];
  this._rejectsFuncs = [];
  this.state = 'pending';
  this.value = null;

  this.onFullFill = function(value) {
    this.state = 'fulfilled';
    this.value = value;
    this._fullFillFuncs.forEach(function(fn) {
      fn(value);
    });
  }.bind(this);

  this.onReject = function(reason) {
    this.state = 'rejected';
    this.reason = reason;
    this._rejectsFuncs.forEach(function(fn) {
      fn(reason);
    });
  }.bind(this);

  fn(this.onFullFill, this.onReject);
};

Promise.resolve = function(value) {
  var promise = new Promise(function(resolve) {
    resolve(value);
  });
  
  return promise;
};

Promise.reject = function(reason) {
  var promise = new Promise(function(resolve, reject) {
    reject(reason);
  });

  return promise;
};

Promise.prototype.then = function(fn) {
  if (this.state === 'pending') {
    this._fullFillFuncs.push(fn);
  }
  else if (this.state === 'fulfilled') {
    fn(this.value);
  }
  return this;
};

Promise.prototype.catch = function(fn) {
  if (this.state === 'pending') {
    this._rejectsFuncs.push(fn);
  }
  else if (this.state === 'rejected') {
    fn(this.reason);
  }
  return this;
};

module.exports = Promise;

});
require.register('./src/xqcore-logger.js', function(module, exports, require) { /**
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

'use strict';

var XQCore = require('./xqcore-core');

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
    if (XQCore.logLevel >= 3) {
        args = Array.prototype.slice.call(arguments);

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
    if (XQCore.logLevel >= 2) {
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
    if (XQCore.logLevel >= 1) {
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
    if (XQCore.logLevel >= 4) {
        args = Array.prototype.slice.call(arguments);

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
    this.warn('Logger.dev() is deprcated since v0.13! Use Logger.debug() instead');
    this.debug.call(arguments);
};

Logger.prototype.req = Logger.prototype.log;
Logger.prototype.res = Logger.prototype.log;

/**
 * Returns a human readable time format
 * @method getHumanTime
 * @private
 * @param  {Number}     time Time in milliseconds
 * @return {String}          Returns a readable time string
 */
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

//--

module.exports = Logger;

});
require.register('./src/xqcore-readystate.js', function(module, exports, require) { 'use strict';

/**
 * XQCore.ReadyState module
 * 
 * Holds a function call until a state becomes ready
 * 
 * @module XQCore.ReadyState
 */
var ReadyState = function() {
    this.__isReady = false;
    this.__readyFuncs = [];
};

/**
 * Wait till view is ready
 *
 * @method ready
 * @param {Function} fn FUnction to be called if state becomes ready
 */
ReadyState.prototype.ready = function(fn) {
    if (this.__isReady) {
        fn.call(this);
    }
    else {
        this.__readyFuncs.push(fn);
    }
};

/**
 * Sets a state ready and calls all retained functions
 * 
 * @method setReady
 */
ReadyState.prototype.setReady = function() {
    var self = this;

    this.__isReady = true;
    
    if (this.__readyFuncs) {
        this.__readyFuncs.forEach(function(fn) {
            fn.call(self);
        });
        this.__readyFuncs = [];
    }
};

/**
 * Unsets a ready state
 * 
 * @method unsetReady
 */
ReadyState.prototype.unsetReady = function() {
    this.__isReady = false;
};

//--

module.exports = ReadyState;

});
require.register('./src/xqcore-event.js', function(module, exports, require) { /**
 * XQFire Event
 *
 * A powerfull event emitter
 *
 * @module XQFire.Event
 *
 * @example {js}
 * var ee = new XQFire.Event();
 * ee.on('echo', function(msg) {
 *     console.log('Msg:', msg);
 * });
 *
 * //Emit an event
 * ee.emit('echo', 'Hello World!');
 *
 * @example {js}
 * var MyModule = function() {
 *     //Call Event constructor
 *     XQFire.Event.call(this);
 * };
 *
 * //Extend MyModule with event emitter methods
 * XQFire.extend(MyModule.prototype, XQFire.Event.prototype);
 */

'use strict';

var XQFire = require('./xqcore-core');
var Logger = require('./xqcore-logger');

var log;

/**
 * An EventListener represents a single event.
 *
 * Each event registration is an instance of EventListener
 *
 * @constructor
 * @group XQFire.Event.EventListener
 * @private
 * @method  EventListener
 */
var EventListener = function(ee, event, fn) {
    this.fn = fn;
    this.calls = 0;
    this.once = false;

    /**
     * Removes this event listener
     * @group XQFire.Event.EventListener
     * @private
     * @method remove
     * @return {Boolean} Returns true if event was removed
     */
    this.remove = function() {
        ee.off(event, fn);
    };
};



/**
 * Event emitter constructor
 *
 * @constructor
 * @method EventEmitter
 */
var EventEmitter = function() {
    log  = new Logger('EventEmitter');
    this.__events = {};
    this.__logger = log;

    /**
     * Sets max length of event listeners
     * @property {Number} maxLength
     */
    this.maxLength = XQFire.eventListenerMaxLength;
};

/**
 * Registers an event listener
 * @method on
 * @param  {String}   event Event name
 * @param  {Function} fn    Event function
 * @return {Object}         Returns an EventListener instance
 */
EventEmitter.prototype.on = function(event, fn) {
    var listener = new EventListener(this, event, fn);
    if (!this.__events[event]) {
        this.__events[event] = [];
    }

    this.__events[event].push(listener);
    if (this.__events[event].length > this.maxLength) {
        log.warn('Listener max length was exceeded!', 'List:', event, 'Length:', this.__events[event].length);
    }
    else {
        log.info('Register new `' + event + '` event');
    }

    return listener;
};

/**
 * Registers an once event listener. This listener is called only once a time.
 *
 * @method once
 * @param  {event}  event  Event name
 * @param  {Function} fn    Event function
 * @return {Object}         Returns an EventListener instance
 */
EventEmitter.prototype.once = function(event, fn) {
    var args = Array.prototype.slice.call(arguments);
    var listener = this.on.apply(this, args);
    listener.once = true;
    return listener;
};

/**
 * Emits an event
 * @method emit
 * @param  {String} event Event name
 * @param  {Any} data  Event data, you can use multiple args here
 * @return {Number}    Returns the number of emited events
 */
EventEmitter.prototype.emit = function(event, data) {
    if (!this.__events[event]) {
        log.info('Emit `' + event + '` event failed! No listener of this type are registered');
        return 0;
    }

    var args = Array.prototype.slice.call(arguments, 1),
        len = this.__events[event].length;

    for (var i = len - 1; i >= 0; i--) {
        var listener = this.__events[event][i];
        listener.fn.apply(this, args);
        listener.calls++;
        if (listener.once === true) {
            this.__events[event].splice(i, 1);
        }
    }

    if (len) {
        log.info('Emit `' + event + '` event to', len, 'listener');
        log.debug(' ... data:', data);
    }

    return len;
};

/**
 * Unregisters events
 *
 * @method off
 * @param  {String}  event  Event name
 * @param  {Function}  [fn]  Event function. If this property is set only that function will be removed. Otherwis all events of this name will be removed
 * @return {Number} Returns the number of removed events
 */
EventEmitter.prototype.off = function(event, fn) {
    var removed = 0;

    if (!this.__events[event]) {
        log.info('Unregister events failed! No `' + event + '` events were found!');
        return 0;
    }

    if (fn) {
        var len = this.__events[event].length;
        for (var i = 0; i < len; i++) {
            var listener = this.__events[event][i];
            if (listener && listener.fn === fn) {
                this.__events[event].splice(i, 1);
                removed++;
                //Do not break at this point, to remove duplicated events

                if (this.__events[event].length === 0) {
                    delete this.__events[event];
                }
            }
        }
    }
    else {
        removed = this.__events[event].length;
        delete this.__events[event];
    }

    log.info('Unregister `' + event + '` events!', 'Removed ' + removed + ' listener');
    return removed;
};

/**
 * Removes all registered events
 * @method clear
 * @return {Number} Returns the number of removed events
 */
EventEmitter.prototype.clearEvents = function() {
    this.__events = {};
};

//--

module.exports = EventEmitter;

});
require.register('./src/xqcore-sync.js', function(module, exports, require) { /**
 * XQCore.Sync
 *
 * @module  XQCore.Sync
 */
'use strict';

var XQCore = require('./xqcore-core');
var $ = require('jquery');

var Sync = function() {
    /**
     * Sets a server URI
     *
     * This URI is used by all send methods as default server URI
     * @property {String} server
     */
    this.server = null;

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
        data = this.toJSON ? this.toJSON() : null;
    }
    else if (data === undefined) {
        data = this.toJSON ? this.toJSON() : null;
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

    var promise = new Promise(function(resolve, reject) {
        $.ajax({
            url: url,
            type: method,
            data: XQCore.isEmpty(data) ? null : JSON.stringify(data),
            dataType: 'json',
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json'
            },
            success: function(data, status, jqXHR) {
                if (typeof callback === 'function') {
                    callback.call(self, null, data, status, jqXHR);
                }
                self.state('success');
                resolve(data);
            },
            error: function(jqXHR, status, error) {
                if (typeof callback === 'function') {
                    callback.call(self, {
                        type: status,
                        http: error
                    }, null, status, jqXHR);
                }
                self.state('failed');
                reject({
                    type: status,
                    http: error
                });
            }
        });
    });

    return promise;
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
    return this.send('POST', url, data, callback);
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
    return this.send('GET', url, data, callback);
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
    return this.send('PUT', url, data, callback);
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
    return this.send('DELETE', url, data, callback);
};

/**
 * Fetch data from server
 *
 * @param {Object} query MongoDB query 
 * @param {Function} callback Callback function
 */
Sync.prototype.fetch = function(query, callback) {
    return this.sendGET(query, callback);
};

/**
 * Save a model if it's valid
 */
Sync.prototype.save = function(data, callback) {
    if (typeof data === 'function') {
        callback = data;
        data = this.schema ? this.getByKeys(Object.keys(this.schema)) : this.toJSON();
    }

    if (this.isValid()) {
        return this.sendPOST(data, callback);
    }
    else {
        if (typeof callback === 'function') {
            callback({
                msg: 'Model isn\'t valid. Cancle save'
            });
        }
        else {
            return Promise.reject({
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
        data = this.schema ? this.getByKeys(Object.keys(this.schema)) : this.toJSON();
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
 * If validation doesn't fail, update or save methode have to be called.
 * It calls update if data.id is not undefined, otherwise it calls save
 * Override this function if this behavior isn't desired 
 * 
 * @method sync
 * @override
 * @param  {Any} data     data
 */
Sync.prototype.submit = function(data) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.set(data, { extend: true })
        .then(function() {
            if (self.server) {
                if (self.get('id') === undefined || self.get('id') === null) {
                    self.save(data)
                    .then(function(result) {
                        resolve(result);
                        self.emit('data.submit', result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
                }
                else {
                    self.update(data)
                    .then(function(result) {
                        resolve(result);
                        self.emit('data.submit', result);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
                }
            }

        });
    });
    
    return promise;
};

//--

module.exports = Sync;

});
require.register('./src/xqcore-list.js', function(module, exports, require) { /**
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

'use strict';

var XQCore = require('./xqcore-core');

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
var List = function(name, conf) {
    //Call XQCore.ReadyState constructor
    XQCore.ReadyState.call(this);

    //Call Event constructor
    XQCore.Event.call(this);

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

    /**
     * List name
     * @property {String} name
     */
    this.name = (name ? name.replace(/List$/, '') : 'Nameless') + 'List';

    /**
     * Contains list items
     * @property {Array} items
     */
    this.items = [];

    /**
     * Sets a maxlength of items
     * @property {Number} maxlength
     * @default null
     */
    this.maxLength = null;

    /**
     * Sets the Model to be used to create new models in push and unshift methods.
     * @property {Object} model
     */
    if (!this.model) {
        this.model = XQCore.Model;
    }

    /*!
     * Mapping of initial conf
     */
    if (typeof conf === 'function') {
        conf.call(this, self);
    }
    else {
        XQCore.extend(this, conf);
    }

    /**
     * Sets default values
     * @property {Object|Array} defaults
     */
    if (this.defaults && !XQCore.isEmpty(this.defaults)) {
        this.push(this.defaults, {
            silent: true,
            noValidation: true
        });
    }
    
    /*!
     * Sets ready state
     */
    this.state('ready');
    this.setReady();
};

//Extend with ready state
XQCore.extend(List.prototype, XQCore.ReadyState.prototype);
XQCore.extend(List.prototype, XQCore.Event.prototype);

XQCore.extend(List.prototype, new XQCore.Logger());

if (XQCore.Sync) {
    XQCore.extend(List.prototype, XQCore.Sync.prototype);
}

/**
 * Inherits a list prototype
 * @method inherit
 * @param  {String} name    list name
 * @param  {Object} options Model properties
 * @return {Object}         Returns a XQCore.Model prototype
 */
List.inherit = function(name, options) {
    if (typeof name === 'object') {
        options = name;
        name = undefined;
    }

    var Proto = function() {
        XQCore.List.call(this, name, options);
    };

    Proto.prototype = Object.create(XQCore.List.prototype);
    Proto.prototype.constructor = Proto;
    return Proto;
};

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
            model.set(item, {
                noSync: true,
                silent: true
            });
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

    if (length) {
        if (this.maxLength && this.items.length > this.maxLength) {
            this.items.splice(0, this.items.length - this.maxLength);
        }

        if (!options.silent) {
            this.emit('item.push', models, length);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('push', models);
            }
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
            model.set(item, {
                noSync: true,
                silent: true
            });
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

    if (length) {
        if (this.maxLength && this.items.length > this.maxLength) {
            this.items.splice(this.maxLength);
        }

        if (!options.silent) {
            this.emit('item.unshift', models, length);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('unshift', models);
            }
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
 * @param {Object|Number} match Match to find element which should be updated
 * @param {Object} data Model instance or a plain data object.
 * @param {Object} options Options object
 * {
 *     silent: true,    //Disable event emitting
 *     noSync: true     //Don't call sync method
 * }
 *
 * @fires item.update
 * Fires an item.update event if item was succesfully updated. Othwewise fires an item.push event
 *
 * @returns {Object} Returns the updated item
 */
List.prototype.update = function(match, data, options) {
    options = options || {};

    var updateItem;
    if (typeof match === 'number') {

        updateItem = this.items[match];
    }
    else {
        updateItem = this.findOne(match);
    }

    if (updateItem) {
        updateItem.set(data, { noSync: true, silent: true });
        
        if (!options.silent) {
            this.emit('item.update', updateItem);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('update', match, data);
            }
        }
    }

    return updateItem;
};

/**
 * Removes an item at a given position
 *
 * @param {Object|Number} match Match to find element which should be removed
 * @param {Object} options Options object
 * {
 *     silent: true,    //Disable event emitting
 *     noSync: true     //Don't call sync method
 * }
 *
 * @fires item.remove
 * Fires an item.remove event if item was succesfully removed.
 *
 * @returns {Object} Returns the removed item
 */
List.prototype.remove = function(match, options) {
    options = options || {};

    var removedItem,
        index = 0;
    if (typeof match === 'number') {
        removedItem = this.items[match];
        index = match;
    }
    else {
        removedItem = this.findOne(match);
        for (var i = 0, len = this.items.length; i < len; i++) {
            if (this.items[i] === removedItem) {
                index = i;
                break;
            }
        }
    }

    if (removedItem) {
        this.items.splice(index, 1);
        
        if (!options.silent) {
            this.emit('item.remove', removedItem, index);
        }

        if (!options.noSync) {
            if (typeof this.sync === 'function') {
                this.sync('remove', match, index);
            }
        }
    }

    return removedItem;
};

/**
 * Clears the whole list
 * @param  {Object} options Options object
 * {
 *     silent: true,    //Disable event emitting
 *     noSync: true     //Don't call sync method
 * }
 *
 * @fires item.clear
 * Fires an item.clear event if item was succesfully cleared. It will not fire any events on an empty list
 *
 * @returns {Number} Returns the amount of removed items
 */
List.prototype.clear = function(options) {
    options = options || {};

    if (this.items.length === 0) {
        return 0;
    }
    
    var oldValue = this.toArray();

    this.items = [];

    if (!options.silent) {
        this.emit('item.clear', oldValue);
    }

    if (!options.noSync) {
        if (typeof this.sync === 'function') {
            this.sync('clear', oldValue);
        }
    }

    return oldValue.length;
};

/**
 * Returns list items as an array
 * @method toArray
 * @return {Array} Returns an array of list items
 */
List.prototype.toArray = function() {
    return this.items.map(function(model) {
        return model.properties;
    });
};

/**
 * Compatibility, does the same as toArray()
 * @method toJSON   
 * @return {Array} Returns an array of list items
 */
List.prototype.toJSON = function() {
    return this.toArray();
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

/**
 * Calls a function on each item.
 * Optionally traverse the `initial` object through all methods and returns it at the end.
 *
 * @method each
 * @param  {Object}   initial Object which will be traversed and returned at the end
 * @param  {Function} fn      Funtion to be called on each item. Gets the model as first arg and the traversing object as second arg.
 * @returns {Object}          Returns a traversed object
 */
List.prototype.each = function(initial, fn) {
    if (typeof initial === 'function') {
        fn = initial;
        initial = {};
    }

    var data = initial;
    for (var i = 0, len = this.items.length; i < len; i++) {
        data = fn(this.items[i], data);
    }

    return data;
};

//--

module.exports = List;

});
require.register('./src/xqcore-model.js', function(module, exports, require) { /**
 * XQCore Model
 *
 * This module organizes your data.
 * A model has different states and changes it on a specific action.
 *
 * States:
 * starting | Before initialization
 * ready    | Initial state
 * valid    | Validation was successfull
 * invalid  | Validation failed
 * 
 *  
 * @module  XQCore.Model
 * @requires XQCore.Utils
 * @requires XQCore.Event
 * @requires XQCore.Logger
 */

'use strict';

var XQCore = require('./xqcore-core');

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
var Model = function(name, conf) {
    //Call XQCore.Logger constructor
    XQCore.Logger.call(this);

    //Call XQCore.ReadyState constructor
    XQCore.ReadyState.call(this);

    //Call Event constructor
    XQCore.Event.call(this);

    if (typeof arguments[0] === 'object') {
        conf = name;
        name = conf.name;
    }

    /**
     * Enable debug mode
     * @public
     * @type {Boolean}
     */
    this.logLevel = XQCore.logLevel;

    /**
     * Stores models properties
     * @type {Object}
     * @property properties
     */
    this.properties = {};

    /**
     * Contains last validation errors if state is invalid
     * @type {Array}
     * @property lastValidationError
     */
    this.lastValidationError = null;

    //-- Initial conf mapping
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
    this.__isValid = false;

    this.customValidate = conf.validate;
    delete conf.validate;

    this.conf = conf;

    /**
     * Model name
     * @property {String} name
     */
    this.name = (name ? name.replace(/Model$/, '') : 'Nameless') + 'Model';

    //-- Add default values
    if (this.defaults && !XQCore.isEmptyObject(this.defaults)) {
        this.set(this.defaults, {
            silent: true,
            noValidation: true
        });
    }

    //-- Add schema props as default values
    if (this.schema) {
        Object.keys(this.schema).forEach(function(key) {
            if (!(key in this.properties)) {
                this.properties[key] = this.schema[key].default !== undefined ? this.schema[key].default : null;
            }
        }, this);
    }

    this.__isValid = !this.schema;
    this.state('ready');
};


//Extend with ready state
XQCore.extend(Model.prototype, XQCore.ReadyState.prototype);
XQCore.extend(Model.prototype, XQCore.Event.prototype);
XQCore.extend(Model.prototype, XQCore.Logger.prototype);

if (XQCore.Sync) {
    XQCore.extend(Model.prototype, XQCore.Sync.prototype);
}


/**
 * Inherits a model prototype
 * @method inherit
 * @static
 * @param  {String} name    model name
 * @param  {Object} options Model properties
 * @return {Object}         Returns a XQCore.Model prototype
 */
Model.inherit = function(name, options) {
    if (typeof name === 'object') {
        options = name;
        name = undefined;
    }

    var Proto = function(_name, _options) {
        //TODO call this later, ready state will be set before _options had been run
        XQCore.Model.call(this, name, options);

        if (_name) {
            if (typeof _name === 'string') {
                name = _name;
            }
            else {
                _options = _name;
            }

            if (typeof _options === 'function') {
                _options.call(this, this);
            }
            else if (typeof _options === 'object') {
                XQCore.extend(this, _options);
            }
        }
    };

    Proto.prototype = Object.create(XQCore.Model.prototype);
    Proto.prototype.constructor = Proto;
    return Proto;
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
 *   replace: <Boolean> Replace all date with new data
 *   noSync: <Boolean> Do not call sync method. Default: false
 * }
 *
 * @method set
 * @param {String} key
 * @param {Object} value Data value
 * @param {Object} options Options
 *
 * @returns {Object} Returns a promise object
 */
Model.prototype.set = function(key, value, options) {
    var newData = {},
        oldData = this.get(),
        validationResult,
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
        this.log('Set value', key, value, oldData);
    }
    else {
        this.warn('Data are incorrect in model.set()', arguments);
    }

    options = options || {};

    if (options.noValidation !== true) {
        if (this.customValidate) {
            this.log('Using a custom validation!');
            validationResult = this.customValidate(newData);
        }
        else if (this.schema) {
            validationResult = this.validate(newData);
            if (setItem && validationResult) {
                var newValidationResult;
                for (var i = 0, len = validationResult.length; i < len; i++) {
                    if (validationResult[i].property === key) {
                        newValidationResult = [validationResult[i]];
                        break;
                    }
                }

                validationResult = newValidationResult || null;
            }
        }
        
        if (validationResult) {
            this.warn('Validation error', validationResult);
            if (options.silent !== true) {
                this.emit('validation.error', validationResult, newData);
            }

            return XQCore.Promise.reject({
                msg: 'validation.error',
                err: validationResult
            });
        }
    }

    this.properties = newData;
    if (options.silent !== true) {
        if (setAll) {
            if (!options.noSync && typeof this.sync === 'function') {
                this.sync(options.replace ? 'replace' : 'set', newData);
            }
            else {
                //TODO show only replaced data if set is using
                this.emit(options.replace ? 'data.replace' : 'data.set', newData, oldData);
            }
        }
        else if (setItem){
            if (!options.noSync && typeof this.sync === 'function') {
                this.sync('value', key, value);
            }
            
            this.emit('value.set', key, value);
        }

        this.emit('data.change', newData, oldData);
    }

    return XQCore.Promise.resolve(newData);
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
 * @returns {Object}    Returns the whole model or a filtered dataset
 */
Model.prototype.get = function(key, options) {
    if (options === undefined) {
        options = {};
    }

    var data;

    if (typeof key === 'object' && arguments.length === 1) {
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
    else if (typeof key === 'string' && typeof options === 'number') {
        var index = options;
        if (arguments.length === 3) {
            options = arguments[2];
        }

        var item = this.get(key);

        if (options.copy === true) {
            if (typeof item[index] === 'object') {
                return XQCore.extend({}, item[index]);
            }
        }

        return item ? item[index] : null;
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
 * Removes all data from model
 *
 * @method reset
 * @param  {Object} options Options object
 * {
 *     removeListener: true,    //Remove all event listener
 *     silent: true,            //Disable event emitting
 *     noSync: true             //Don't call sync method
 * }
 *
 * @fires data.reset
 * Fires a data.reset event if model was succesfully reseted.
 *
 * @returns {Object} Returns removed data
 *
 */
Model.prototype.reset = function(options) {
    options = options || {};

    this.log('Reset model');
    var oldData = this.get();
    this.properties = XQCore.extend({}, this.defaults);
    this.state('ready');
    if (!options.silent) {
        this.emit('data.reset', oldData);
    }

    if (options.removeListener) {
        this.clearEvents();
    }
    
    if (!options.noSync) {
        if (typeof this.sync === 'function') {
            this.sync('reset', oldData);
        }
    }
    
    return oldData;
};

/**
 * Push data to a subset
 *
 * @method push
 * @param {String} path path to subset
 * @param {Object} data data to add
 */
Model.prototype.push = function(path, data, options) {
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
        this.error('Model.push requires an array. Dataset isn\'t an array. Path: ', path);
        return;
    }

    if (options.silent !== true) {
        if (!options.noSync && typeof this.sync === 'function') {
            this.sync('insert', path, -1, data);
        }

        this.emit('item.insert', path, -1, data);
        this.emit('data.change', this.properties);
    }
};

/**
 * Unshift data to a subset
 *
 * @method unshift
 * @param {String} path path to subset
 * @param {Object} data data to add
 */
Model.prototype.unshift = function(path, data, options) {
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
        this.error('Model.unshift requires an array. Dataset isn\'t an array. Path: ', path);
        return;
    }

    if (options.silent !== true) {
        if (!options.noSync && typeof this.sync === 'function') {
            this.sync('insert', path, 0, data);
        }

        this.emit('item.insert', path, 0, data);
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
        if (index === -1) {
            dataset.push(data);
        }
        else if (index === 0) {
            dataset.unshift(data);
        }
        else {
            dataset.splice(index, 0, data);
        }
    }
    else if (!dataset) {
        XQCore.dedotify(this.properties, path, [data]);
    }
    else {
        this.error('Model.insert requires an array. Dataset isn\'t an array. Path: ', path);
        return;
    }

    if (options.silent !== true) {
        if (!options.noSync && typeof this.sync === 'function') {
            this.sync('insert', path, index, data);
        }

        this.emit('item.insert', path, index, data);
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
        if (!options.noSync && typeof this.sync === 'function') {
            this.sync('remove', path, index);
        }

        this.emit('item.remove', path, index, removed[0]);
        this.emit('data.change', this.properties);
    }

    return removed;
};

/**
 * Replace all models data with new data. This is a alias for set(<AnyData>, {replace: true})
 *
 * @method replace
 * @param {Object} data Data object
 * @param {Object} options Option data. (See set method for details)
 */
Model.prototype.replace = function(data, options) {
    options = options || {};
    options.replace = true;
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
 * Updates a dataset
 * @development
 * 
 * @method modify
 * @param {String} path Parent path
 * @param {Number|Object} match Search match or index to find the to be modifyd item
 * @param {Object} data Update date
 */
Model.prototype.modify = function(path, match, data, options) {
    var item;

    options = options || {};

    if (typeof match === 'number') {
        item = this.get(path, match);
    }
    else {
        item = this.search(path, match);
    }

    var oldData = XQCore.extend({}, item);
    if (item) {
        XQCore.extend(item, data);

        if (options.silent !== true) {
            this.emit('data.modify', path, match, data, oldData);
            this.emit('data.change', this.properties);
        }

        if (!options.noSync && typeof this.sync === 'function') {
            this.sync('modify', path, match, data);
        }
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
        failed = [],
        subFailed;
        
    schema = schema || this.schema;

    if (schema) {
        Object.keys(schema).forEach(function(key) {
            console.log('KEY', key);
            if (typeof schema[key] === 'object' && typeof schema[key].type === 'undefined') {
                if (schema[key].ref && schema[key].schema) {
                    console.log('Has a subref to %s', schema[key].ref);
                    subFailed = self.validate(data, schema[key].schema);
                    if (subFailed) {
                        failed = failed.concat(subFailed);
                    }
                }
                else {
                    console.log('SUBVAL');
                    subFailed = self.validate(XQCore.extend({}, data[key]), XQCore.extend({}, schema[key]));
                    console.log('RES', subFailed);
                    if (Array.isArray(subFailed) && subFailed.length > 0) {
                        failed = failed.concat(subFailed);
                    }
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
        this.__isValid = true;
        this.lastValidationError = null;
        this.state('valid');
        return null;
    }
    else {
        this.__isValid = false;
        this.lastValidationError = failed;
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
        schemaType;

    if (schema.type === undefined) {
        if ( !schema.ref) {
            throw new Error('No schema type are set!');
        }

        schemaType = 'ref';
    } else {
        schemaType = schema.type.toLowerCase();
    }

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
 * Checks the validation of a property without changeing any states
 *
 * @method checkValidation
 * @param  {String}  key  Property name
 * @param {String} value Property value
 * @returns {Boolean} Returns true if validation had been passed
 */
Model.prototype.checkValidation = function(key, value) {
    var check = this.validateOne(this.schema[key], value, key);
    return check.isValid;
};

/**
 * Returns the validation state of the model
 * 
 * @method isValid
 * @returns {Boolean} Returns true when model data are valid. When no data was set it'll returns false
 */
Model.prototype.isValid = function() {
    return this.__isValid;
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
                errCode: 71
            };
        }
    },

    /**
     * Validation type email         *
     */
    'email': function(value, schema) {
        if (!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) {
            return {
                msg: 'Property isn\'t a valid email',
                errCode: 72
            };
        }
    }
};

/**
 * Returns model as JSON
 * @method toJSON
 * @return {Object} Returns model data as JSON
 */
Model.prototype.toJSON = function() {
    return this.get();
};

//--

module.exports = Model;

});
require.register('./src/xqcore-presenter.js', function(module, exports, require) { /**
 * XQCore Presenter
 *
 * A presenter controlls your models, lists and views.
 * It renders views as long as any data had been changed.
 *
 * @module XQCore.Presenter
 */

'use strict';

var XQCore = require('./xqcore-core');

var log;

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
  this.router = XQCore.Router.getInstance();

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

  //-- Initial config mapping
  if (typeof fn === 'function') {
    fn.call(this, self, log);
  }
};

XQCore.extend(Presenter.prototype, new XQCore.Event());

/**
 * Add a history item to the browser history
 *
 * @method pushState
 *
 * @param {String} url Page URL (Optional) defaults to the curent URL
 * @param {Object} data Data object
 */
Presenter.prototype.pushState = function(url, data) {
  // log.info('Check State', data, history.state, XQCore.compare(data, history.state));
  // if (XQCore.compare(data, history.state)) {
  //     this.warn('Abborting history.pushState because data are equale to current history state');
  // }
  var hash = XQCore.html5Routes || url.charAt(0) === '/' ? '' : XQCore.hashBang;
  url = hash + url;
  history.pushState(data, '', url || null);
  log.info('Update history with pushState. New URL: ' + data, url);
};

/**
 * Add a history item to the browser history
 *
 * @method replaceState
 *
 * @param {String} url Page URL (Optional) defaults to the current URL
 * @param {Object} data Data object
 */
Presenter.prototype.replaceState = function(url, data) {
  var hash = XQCore.html5Routes || url.charAt(0) === '/' ? '' : XQCore.hashBang;
  url = hash + url;
  history.replaceState(data, '', url || null);
  log.info('Update history with replaceState. New URL: ' + data, url);
};

/**
 * Navigates to a given route
 *
 * @method  navigateTo
 *
 * Options: {
 *  replace: <Boolean> Replace current history entry with route (Only when html5 routes are enabled)
 *  noPush: <Boolean> Set this to false to surpress a route change when new route equals to old route
 * }
 *
 * @param {String} route Route url
 * @param {Object} options Options
 */
Presenter.prototype.navigateTo = function(route, options) {
  //TODO check route trigger
  options = options || {};
  if (XQCore.html5Routes) {
    this.router.callRoute(route, options);
  }
  else {
    location.hash = XQCore.hashBang + route;
    this.router.callRoute(route, options);
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
  conf = conf || {};

  if (model instanceof XQCore.List) {
    this.coupleList(view, model, conf);
  }
  else {
    this.coupleModel(view, model, conf);
  }

  this.coupleView(view, model, conf);
};

Presenter.prototype.coupleComponent = function(cmp, model) {
  if (model instanceof XQCore.List) {
    var list = model;
    list.on('item.push', function(item) {
      console.log('push item', item);
      var val = item[0].get();
      console.log('value', val);
      cmp.push(val);
    });
  }
  else {
    cmp.on('value.change', function(data) {
      console.log('CMP CHANGE', data);
      model.set(data.name, data.value);
    });

    model.on('validation.error', function(validationResult, other) {
      console.log('VALIDATION', validationResult, other);
      cmp.setState('invalid');
      cmp.setError(validationResult[0].msg);
    });

    model.on('state.change', function(state) {
      cmp.setState(state);
    });
  }
};

/**
 * Couples a view onto a model
 *
 * @method coupleModel
 * @param {Object} view XQCore.View instance
 * @param {Object} model XQCore.Model instance
 */
Presenter.prototype.coupleModel = function(view, model, conf) {
  conf = conf || {};

  if (!(view instanceof XQCore.View)) {
    return log.error('Could not couple model with view. First arg is not a valid view!');
  }

  if (!(model instanceof XQCore.Model)) {
    return log.error('Could not couple model with view. Second arg is not a valid model!');
  }

  if (model.__coupled) {
    model.__coupled.uncouple();
    // return log.error('View', view.name, 'already coupled with', view.__coupled.obj.name, '. Only one model or list can be coupled with a view!');
  }

  log.info('Couple model', model.name, 'with', view.name);

  model.__coupled = {
    obj: view,
    events: [],
    uncouple: function() {
      log.info('Uncouple model', model.name, 'from', view.name);
      model.__coupled.events.forEach(function(ev) {
        ev.remove();
      });

      delete model.__coupled;
    }
  };

  var eventsMap = {
    'data.replace': 'render',
    'data.set': 'render',
    'value.set': 'change',
    // 'item.insert': 'xrender',
    'item.remove': 'remove',
    'validation.error': 'validationFailed',
    'state.change': 'onStateChange'
  };

  var listener = function(listener, func) {
    var fn = typeof func === 'function' ? func : view[func].bind(view);
    var handler = model.on(listener, fn);
    model.__coupled.events.push(handler);
  };

  for (var key in eventsMap) {
    if (eventsMap.hasOwnProperty(key)) {
      listener(key, eventsMap[key]);
    }
  }

  //Initial view render with current model data
  view.render(model.get());

};

/**
 * Couples a listwith a view
 *
 * @method coupleList
 * @param {Object} view XQCore.View instance
 * @param {Object} model XQCore.Model instance
 */
Presenter.prototype.coupleList = function(view, list) {
  if (!(view instanceof XQCore.View)) {
    return log.error('Could not couple list with view. First arg is not a valid view!');
  }

  if (!(list instanceof XQCore.List)) {
    return log.error('Could not couple list with view. Second arg is not a valid list!');
  }

  if (list.__coupled) {
    list.__coupled.uncouple();
    // return log.error('View', view.name, 'already coupled with', view.__coupled.obj.name, '. Only one model or list can be coupled with a view!');
  }

  log.info('Couple list', list.name, 'with', view.name);

  list.__coupled = {
    obj: view,
    events: [],
    uncouple: function() {
      log.info('Uncouple list', list.name, 'from', view.name);
      list.__coupled.events.forEach(function(ev) {
        ev.remove();
      });

      delete list.__coupled;
    }
  };

  var eventsMap = {
    'item.push': function(data) {
      view.append('_ftl_root', data[0].toJSON());
    },
    'item.unshift': 'prepend',
    'item.pop': 'removeLast',
    'item.shift': 'removeFirst',
    'item.update': 'update',
    'item.remove': function(item, index) {
      view.remove('_ftl_root', index);
    },
    'state.change': 'onStateChange'
  };

  var listener = function(listener, func) {
    var fn = typeof func === 'function' ? func : view[func].bind(view);
    var handler = list.on(listener, fn);
    list.__coupled.events.push(handler);
  };

  for (var key in eventsMap) {
    if (eventsMap.hasOwnProperty(key)) {
      listener(key, eventsMap[key]);
    }
  }

  //Initial view render with current list data
  view.render(list.toArray());

};

/**
 * Couples a view with a model or a list
 *
 * @method coupleView
 * @param {Object} view XQCore.View instance
 * @param {Object} model XQCore.Model or XQCore.List instance
 */
Presenter.prototype.coupleView = function(view, model) {
  if (!(view instanceof XQCore.View)) {
    return log.error('Could not couple list with view. First arg is not a valid view!');
  }

  if (!(model instanceof XQCore.Model) && !(model instanceof XQCore.List)) {
    return log.error('Could not couple list with view. Second arg is not a valid model or list!');
  }

  if (view.__coupled) {
    view.__coupled.uncouple();
    // return log.error('Model or List', model.name, 'already coupled with', model.__coupled.obj.name, '. Only one view can be coupled with a model or a list !');
  }

  log.info('Couple view', view.name, 'with', model.name);

  view.__coupled = {
    obj: model,
    events: [],
    uncouple: function(onlySelf) {
      log.info('Uncouple view', view.name, 'from', model.name);
      view.__coupled.events.forEach(function(ev) {
        ev.remove();
      });

      delete view.__coupled;
    }
  };

  var eventsMap;
  if (model instanceof XQCore.Model) {
    eventsMap = {
      'form.submit': 'submit',
      'input.change': 'set',
      'input.edit': function(key, value) {
        var check = model.checkValidation(key, value);
        if (check) {
          view.validationSucceeded(key, value);
        }
        else {
          view.validationFailed([{
            property: name
          }]);
        }
      }
    };
  }
  else {
    eventsMap = {
      'form.submit': 'submit'
    };
  }

  var listener = function(listener, func) {
    var fn = typeof func === 'function' ? func : model[func].bind(model);
    var handler = view.on(listener, fn);
    view.__coupled.events.push(handler);
  };

  for (var key in eventsMap) {
    if (eventsMap.hasOwnProperty(key)) {
      listener(key, eventsMap[key]);
    }
  }

};

/**
 * Initialize a new view into the presenter scope
 *
 * options: {
 *   mode: String       Insert mode, (append, prepend or replace) replace is default
 *   inject: Boolean    Set to false to disable injecting view into the DOM
 *   forms: Boolean|String     View has forms. Add a selector here or set this to true to find all forms
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
  var tmplOptions = {};

  if (options.viewDir) {
    tmplOptions.viewDir = options.viewDir;
  }

  var view = new XQCore.View(viewName, function(self) {
    self.template = XQCore.Tmpl.getTemplate(viewName, tmplOptions);
    self.mode = options.mode || 'replace';
    self.container = container || 'body';
    self.hidden = !!options.hidden;
    self.forms = options.forms;
    if (options.inject === false) {
      self.autoInject = false;
    }
  });

  this.__views[viewName] = view;

  var self = this;
  if (XQCore.html5Routes) {
    view.on('xqcore.navigate', function(url) {
      self.router.callRoute(url);
    });
  }

  return view;
};

/**
 * Register a route listener
 *
 * @public
 * @method route
 * @chainable
 * @param {String | Array} route Route string
 * @param {Function} callback Callback function
 * @returns {Object} Returns this value
 */
Presenter.prototype.route = function(route, callback) {
  var self = this;

  if (typeof callback === 'string') {
    callback = this[callback];
  }

  if (typeof callback === 'function') {
    if (typeof route === 'string') {
      this.router.addRoute(route, callback);
    }
    else if (Array.isArray(route)) {
      route.forEach(function(r) {
        self.router.addRoute(r, callback);
      });
    }
  }
  else {
    log.warn('Router callback isn\'t a function', callback, 'of route', route);
  }

  return this;
};

Presenter.prototype.createView = function (viewTree) {
  log.debug('Render view tree', viewTree);

  var tree = XQCore.recurse([viewTree], function(data, next) {
    var tagName = data.name;
    var view = new XQCore.View(tagName);
    var childs = next(data.childs);
    if (childs) {
      view.append(childs);
    }

    if (data.model) {
      var model = new XQCore.__models[data.model]();

      if (view.el.$change) {
        view.el.on('change', function(evData) {
          if (data.prop) {
            model.set(data.prop, evData);
          }
        });
      }
    }
    else if (data.list) {
      var list = new XQCore.__lists[data.list]();

      if (view.el.$change) {
        view.el.on('change', function(evData) {
          if (data.prop) {
            var listItem = {};
            listItem[data.prop] = evData;
            list.add(listItem);
          }
        });
      }

      if (view.el.push) {
        list.on('item.push', function(model) {
          view.el.push(model[0].get());
        });

        list.each(function(model) {
          view.el.push(model.get());
        });
      }
    }

    return view;
  });

  document.addEventListener('DOMContentLoaded', function() {
    tree[0].injectInto(document.body);
  });
};

//--

module.exports = Presenter;

});
require.register('./src/xqcore-router.js', function(module, exports, require) { /**
 * XQCore router
 * 
 * Based on router.js v2.1.0
 * Copyright Aaron Blohowiak and TJ Holowaychuk 2011.
 * https://github.com/aaronblohowiak/routes.js
 *
 * @module  XQCore.Router
 *
 * @example
 *
 * var router = XQCore.Router.getInstance(); //Returns a singelton
 * router.addRoute('/index', function() {
 *     // index route was called
 * });
 *
 * router.addRoute('/foo/:name', function(data) {
 *     // data.name contains the name part
 * });
 *
 * 
 */

'use strict';

var XQCore = require('./xqcore-core');
var $ = require('jquery');

var log = new XQCore.Logger('Router');

/**
 * Convert path to route object
 *
 * A string or RegExp should be passed,
 * will return { re, src, keys} obj
 *
 * @param  {String / RegExp} path
 * @return {Object}
 */

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @ignore
 * @param  {String} path
 * @param  {Array} keys
 * @return {RegExp}
 */
var pathToRegExp = function(path, keys) {
    path = path
        .concat('/?')
        .replace(/\/\(/g, '(?:/')
        .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?|\*/g, function(_, slash, format, key, capture, optional) {
            if (_ === '*') {
                keys.push(undefined);
                return _;
            }

            keys.push(key);
            slash = slash || '';
            return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || '([^/]+?)') + ')' + (optional || '');
        })
        .replace(/([\/.])/g, '\\$1')
        .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', 'i');
};

var Route = function(path) {
    var src, re, keys = [];
    log.logLevel = XQCore.logLevel;

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
 * Attempt to match the given request to
 * one of the routes. When successful
 * a  {fn, params, splats} obj is returned
 *
 * @param  {Array} routes
 * @param  {String} uri
 * @return {Object}
 */
var match = function(routes, uri, startAt) {
    var captures, i = startAt || 0;

    for (var len = routes.length; i < len; ++i) {
        var route = routes[i],
            re = route.re,
            keys = route.keys,
            splats = [],
            params = {};

        captures = uri.match(re);
        if (captures) {
            for (var j = 1, cLen = captures.length; j < cLen; ++j) {
                var key = keys[j - 1],
                    val = typeof captures[j] === 'string' ? unescape(captures[j]) : captures[j];
                if (key) {
                    params[key] = val;
                } else {
                    splats.push(val);
                }
            }
            return {
                params: params,
                splats: splats,
                route: route.src,
                next: i + 1
            };
        }
    }
};

/**
 * Router constructor
 *
 * @constructor
 */
var Router = function(options) {
    options = options || {};

    /**
     * Contains all registered routes
     *
     * @property {Array} routes
     * @private
     */
    this.routes = [];

    this.routeMap = {};

    if (!options.noListener) {
        this.registerListener();
    }

    var self = this;
    $(function() {
        //Call current page
        self.callRoute(self.getPath(), {
            initialCall: true
        });
    });
};

var instance;

/**
 * Returns a singelton instance of XQCore.Router
 * @return {[type]} [description]
 */
Router.getInstance = function() {
    if (!instance) {
        instance = new XQCore.Router();
    }

    return instance;
};

Router.prototype.registerListener = function() {
    if (XQCore.html5Routes) {
        window.addEventListener('popstate', this.onPopStateHandler.bind(this));
    }
    else {
        window.addEventListener('hashchange', this.onPopStateHandler.bind(this));
    }
};

Router.prototype.onPopStateHandler = function(e) {
    var path = this.getPath();
    this.callRoute(path, {
        noPush: true
    });
};

Router.prototype.getPath = function() {
    var path;
    if (XQCore.html5Routes) {
        path = location.pathname;
        return path.replace(new RegExp('^' + XQCore.basePath), '');
    }
    else {
        path = location.hash;
        path = path.replace(new RegExp('^' + XQCore.hashBang), '');
        path = '/' + path;
        return path;
    }
};

/**
 * Registers a new route
 *
 * @method addRoute
 * @param {String}   path Route path
 * @param {Function} fn   Function to be called when addRoute will be called
 * @returns {Object} Returns this value
 * @chainable
 */
Router.prototype.addRoute = function(path, fn) {
    log.info('Register new route:', path, fn);
    
    if (!path) {
        throw new Error(' route requires a path');
    }
    
    if (!fn) {
        throw new Error(' route ' + path.toString() + ' requires a callback');
    }

    if (this.routeMap[path]) {
        throw new Error('path is already defined: ' + path);
    }

    if (typeof path === 'string') {
        path = path.replace(/\/$/, '');
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }
    }
    
    var route = new Route(path);
    route.fn = fn;

    this.routes.push(route);
    this.routeMap[path] = fn;

    return this;
};

/**
 * Removes a route
 *
 * @method removeRoute
 * @param  {String} path Path to be removed
 * @return {Object}      Returns this value
 * @chainable
 */
Router.prototype.removeRoute = function(path) {
    if (!path) {
        throw new Error(' route requires a path');
    }

    if (!this.routeMap[path]) {
        log.warn('Can not remove route! Route does not exists: ' + path);
        return this;
    }

    for (var i = 0; i < this.routes.length; i++) {
        var route = this.routes[i];
        if (route.src === path) {
            this.routes.splice(i, 1);
        }
    }

    delete this.routeMap[path];
    return this;
};

Router.prototype.match = function(pathname, startAt) {
    var route = match(this.routes, pathname, startAt);
    if (route) {
        route.fn = this.routeMap[route.route];
        route.next = this.match.bind(this, pathname, route.next);
    }
    return route;
};

/**
 * Calls a route
 *
 * Options:
 * --------
 * **noRoute** Doesn't add a push state item
 * **replace** Add a replace state item
 * 
 *
 * @method callRoute
 * @param  {String} path Route path
 * @param {Object} [options] Set options for route call
 * 
 */
Router.prototype.callRoute = function(path, options) {
    options = options || {};

    log.info('Call route', path);

    if (path === undefined) {
        throw new Error('XQCore.Router error! Path is undefined in callRoute()!');
    }

    var route = this.match(path);
    if (!route) {
        log.warn('Could not call any route! No route were found! Called path: ' + path);
        return;
    }

    route.path = path;

    route.initialCall = !!options.initialCall;

    if (XQCore.html5Routes && !options.noPush && !options.replace) {
        history.pushState(null, '', path);
    }
    else if (XQCore.html5Routes && options.replace) {
        history.replaceState(null, '', path);
    }

    var next = function() {
        log.info('... trigger route', this.route, this.fn, this.next);
        this.fn.call(this, this.params, this.splats, function() {
            var nextRoute = this.next();
            if (nextRoute) {
                next.call(nextRoute);
            }
        }.bind(this));
    };

    next.call(route);

};

module.exports = Router;

});
require.register('./src/xqcore-service.js', function(module, exports, require) { /**
 * XQCore Service
 *
 * This module organizes your data.
 * A model has different states and changes it on a specific action.
 *
 * States:
 * starting | Before initialization
 * ready    | Initial state
 * valid    | Validation was successfull
 * invalid  | Validation failed
 * 
 *  
 * @module  XQCore.Service
 * @requires XQCore.Utils
 * @requires XQCore.Event
 * @requires XQCore.Logger
 */

'use strict';

var XQCore = require('./xqcore-core');

/**
 * XQCore.Service base class
 *
 * @class XQCore.Service
 * @constructor
 *
 * @uses XQCore.Logger
 * @uses XQCore.Event
 *
 * @param {Object} conf Service extend object
 */
var Service = function(name, conf) {
    //Call Event constructor
    XQCore.Event.call(this);
    
    if (typeof arguments[0] === 'object') {
        conf = name;
        name = conf.name;
    }

    /**
     * Enable debug mode
     * @public
     * @type {Boolean}
     */
    this.logLevel = XQCore.logLevel;

    if (conf === undefined) {
        conf = {};
    }

    if (typeof conf === 'function') {
        conf.call(this, this);
    }
    else {
        XQCore.extend(this, conf);
    }

    this.conf = conf;

    this.name = (name ? name.replace(/Service$/, '') : 'Nameless') + 'Service';

    if (!this.model && !this.list) {
        throw new Error('Service is not connected to any model or list!');
    }

    if (this.model && this.list) {
        throw new Error('Service is connected to a model and a list. This is not allowed!');
    }
    
    this.isListService = false;
    if (this.model) {
        this.schema = this.schema || this.model.schema || null;
    } else {
        this.schema = this.schema || null;
        if (!this.schema && typeof this.list.model === 'function') {
            var model = new this.list.model();
            this.schema = model.schema;
        }
        this.isListService = true;
    }

    this.__state = 'ready';
};


//Extend with ready state
XQCore.extend(Service.prototype, XQCore.ReadyState.prototype);
XQCore.extend(Service.prototype, XQCore.Event.prototype);
XQCore.extend(Service.prototype, new XQCore.Logger());
// XQCore.extend(Service.prototype, XQCore.Sync.prototype);


/**
 * Inherits a model prototype
 * @method inherit
 * @param  {String} name    model name
 * @param  {Object} options Service properties
 * @return {Object}         Returns a XQCore.Service prototype
 */
Service.inherit = function(name, options) {
    if (typeof name === 'object') {
        options = name;
        name = undefined;
    }

    var Proto = function(_name, _options) {
        //TODO call this later, ready state will be set before _options had been run
        XQCore.Service.call(this, name, options);

        if (_name) {
            if (typeof _name === 'string') {
                name = _name;
            }
            else {
                _options = _name;
            }

            if (typeof _options === 'function') {
                _options.call(this, this);
            }
            else if (typeof _options === 'object') {
                XQCore.extend(this, _options);
            }
        }
    };

    Proto.prototype = Object.create(XQCore.Service.prototype);
    Proto.prototype.constructor = Proto;
    return Proto;
};

/**
 * Change the model state
 *
 * @method state
 * @param {String} state New state
 */
Service.prototype.state = function(state) {
    this.__state = state;
    this.emit('state.' + state);
    this.emit('state.change', state);
};

/**
 * Get the current model state
 *
 * @method getState
 */
Service.prototype.getState = function() {
    return this.__state;
};


// Service.prototype.toJSON = function() {
//     return {};
// };

//--

module.exports = Service;

});
require.register('./src/xqcore-socket-connection.js', function(module, exports, require) { /**
 * Socket connection
 * Creates a socket connection to a socket server. Only one connection is used per server/port combination.
 *
 * @module XQCore.SocketConnection
 */

'use strict';

var XQCore = require('./xqcore-core');
var SockJS = require('sockjs');

var log = new XQCore.Logger('SocketConnection');

var instances = {};

/**
 * SocetConnection object
 * Handles a socket connection
 *
 * @singelton
 * @constructor
 *
 * @example {js}
 * var conn = new XQCore.SocketConnection('http://localhost:9889/xqsocket');
 * conn.ready(function() {
 *     //Connection was successfull
 * });
 */
var SocketConnection = function(url) {
    if (instances[url]) {
        return instances[url];
    }

    //Only one instance per socket server
    instances[url] = this;

    this.__isReady = false;
    this.__onReadyCallbacks = [];

    /**
     * Holds all registered channels
     * @type {Object} __channels
     */
    this.__channels = {};

    /**
     * Holds the SockJS instance
     * @private
     * @type {Object} SockJS instance
     */
    this.conn = null;

    this.connect(url);

    /**
     * Reconnect if connection gets lost
     * @property {Boolean} autoReconnect
     */
    this.autoReconnect = true;

    /**
     * Defines a reconnection interval
     * @type {Number}
     */
    this.reconnectionInterval = 1500;
};

/**
 * Connects to a socket server
 * @param  {String} url Socket server url
 */
SocketConnection.prototype.connect = function(url) {
    var self = this;

    if (!this.conn || this.connectionState === 'disconnected') {
        log.info('Connect to socket server ', url);
        this.conn = new SockJS(url, null, {
            debug: log.logLevel >= 4
        });

        this.connectionState = 'connecting';
        this.conn.onopen = function() {
            log.info('Connection was successful!');
            self.setReady();
            self.connectionState = 'connected';
        };

        this.conn.onmessage = function(e) {
            var msg;

            try {
                msg = JSON.parse(e.data);
            }
            catch(err) {
                console.error('Could not parse socket message!', e.data);
            }

            if (!msg.channel) {
                throw new Error('No socket channel was sent!');
            }

            log.info('Got socket message', msg.eventName, 'in channel ' + msg.channel, msg.args);
            var args = msg.args || [];
            args.unshift(msg.eventName);
            if (self.__channels[msg.channel]) {
                self.__channels[msg.channel].emit.apply(self.__channels[msg.channel], args);
            }
            else {
                log.info(' ... channel not found!', msg.channel);
            }
        };

        this.conn.onclose = function(err) {
            self.connectionState = 'disconnected';
            self.unsetReady();
            log.warn('Connection to ' + url + ' closed!', err);

            if (self.autoReconnect) {
                log.info('Try to reconnect to ' + url);

                setTimeout(function() {
                    self.connect(url);
                }, self.reconnectionInterval);
            }
        };
    }
};

/**
 * Register a channel
 * @param  {String} channel  Channel name
 * @param  {Object} listener Socket object
 */
SocketConnection.prototype.registerChannel = function(channel, listener) {
    log.info('Register new channel', channel);
    if (this.__channels[channel]) {
        log.info(' ... channel already registered!');
    } else {
        this.__channels[channel] = listener;
    }
};

/**
 * Unregister a channel
 * @param  {String} channel  Channel name
 * @param  {Object} listener Socket object
 */
SocketConnection.prototype.unregisterChannel = function(channel) {
    log.info('Unregister channel', channel);
    if (this.__channels[channel]) {
        delete this.__channels[channel];
    } else {
        log.info(' ... channel not found!');
    }
};

/**
 * Sends a socket message to a connected socket server
 *
 * @method send
 * @param {String} channel   Channel name
 * @param {String} eventName Event name
 * @param {Object} data      Data
 *
 */
SocketConnection.prototype.send = function(channel, eventName, data) {
    var self = this;

    var args = Array.prototype.slice.call(arguments, 2);

    this.ready(function() {
        log.info('Send socket message to channel ' + channel, eventName, args);
        self.conn.send(JSON.stringify({
            channel: channel,
            eventName: eventName,
            args: args
        }));
    });
};

/**
 * Call function fn when socket is connected
 *
 * @method ready
 * @param  {Function} fn Function to be called if socket is ready
 */
SocketConnection.prototype.ready = function(fn) {
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
SocketConnection.prototype.setReady = function() {
    var self = this;

    this.__isReady = true;
    this.__onReadyCallbacks.forEach(function(fn) {
        fn.call(self);
    });

    this.__onReadyCallbacks = [];
};

SocketConnection.prototype.unsetReady = function() {
    this.__isReady = false;
};

//--

module.exports = SocketConnection;

});
require.register('./src/xqcore-socket.js', function(module, exports, require) { /**
 * XQCore socket module handles socket connections to a socket server
 * 
 * @module XQCore.Socket
 * @requires XQCore.Logger
 * @requires sockJS-client
 *
 */
'use strict';

var XQCore = require('./xqcore-core');

var log = new XQCore.Logger('Socket');
log.logLevel = 5;

/**
 * Socket connection module
 * @param {String} url     Socket server uri
 * @param {String} channel Socket channel
 *
 * 
 * @example {js}
 * var socket = new XQCore.Socket('http://mysocket.io:9889', 'mychannel');
 * socket.on('data', function() {
 *   console.log('Got data from server');
 * });
 */
var Socket = function(url, channel) {
    //Call Event constructor
    XQCore.Event.call(this);
    
    this.__isReady = false;
    this.__onReadyCallbacks = [];

    this.channel = channel;
    this.socket = new XQCore.SocketConnection(url);
    this.socket.registerChannel(channel, this);
    // this.connect(url, channel);
};

XQCore.extend(Socket.prototype, XQCore.Event.prototype);

/**
 * Sends a socket message to a connected socket server
 *
 * @method send
 * @param {String} eventName Event name
 * @param {Object} data      Event data, multiple args are allowed
 */
Socket.prototype.send = function(eventName, data) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.channel);
    this.socket.send.apply(this.socket, args);
};

module.exports = Socket;

});
require.register('./src/xqcore-synclist.js', function(module, exports, require) { /**
 * XQCore.SyncList - Syncronized list
 *
 * @module  XQCore.SyncList
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
'use strict';

var XQCore = require('./xqcore-core');


var SyncList = function(name, conf) {
    /**
     * @property {Boolean} noAutoRegister Disables auto registration. SyncList.register() must be called manually to register the list at the socket server.
     */
    this.noAutoRegister = false;

    //Call XQCore.List constructor
    XQCore.List.call(this, name, conf);

    this.server = this.server || location.protocol + '//' + location.hostname;
    this.port = this.port || XQCore.socketPort;
    this.path = this.path || 'xqsocket';
    this.channel = this.channel || this.name.toLowerCase();
    this.syncEnabled = false;
    this.connectToSocket();
    if (!this.noAutoRegister) {
        this.register();
    }
};

SyncList.prototype = Object.create(XQCore.List.prototype);
SyncList.prototype.constructor = SyncList;


/**
 * Inherits a sync model prototype
 * @method inherit
 * @param  {String} name    model name
 * @param  {Object} options SyncList properties
 * @return {Object}         Returns a XQCore.SyncList prototype
 */
SyncList.inherit = function(name, options) {
    if (typeof name === 'object') {
        options = name;
        name = undefined;
    }

    var Proto = function() {
        XQCore.SyncList.call(this, name, options);
    };

    Proto.prototype = Object.create(XQCore.SyncList.prototype);
    Proto.prototype.constructor = Proto;
    return Proto;
};
/**
 * Connect to a socket server
 *
 * @method connectToSocket
 */
SyncList.prototype.connectToSocket = function() {
    var socketServer = this.server + ':' + this.port + '/' + this.path;
    if (!this.socket) {
        this.debug('Connect to socket:', socketServer);
        this.socket = new XQCore.Socket(socketServer, this.channel);
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

    self.debug('Register synclist at server:', self.name);

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
    
    self.socket.on('synclist.update', function(match, data) {
        self.update(match, data, opts);
    });
    
    self.socket.on('synclist.clear', function() {
        self.clear(opts);
    });
    
    self.socket.on('synclist.init', function(data) {
        console.log('Got initial data request:', data);
        self.push(data, opts);
    });

    self.socket.send('synclist.register', {
        name: self.name
    });
};

SyncList.prototype.unregister = function() {
    this.debug('Unregister synclist at server:', this.name);
    this.socket.send('synclist.unregister', {
        name: this.name
    });

    this.socket.off('synclist.push');
    this.socket.off('synclist.unshift');
    this.socket.off('synclist.pop');
    this.socket.off('synclist.shift');
    this.socket.off('synclist.update');
    this.socket.off('synclist.clear');
    this.socket.off('synclist.init');
};

/**
 * Send a socket message to the server
 * @param  {String} eventName Event name
 * @param  {Object} data      Data object
 */
SyncList.prototype.emitRemote = function(eventName, data) {
    this.socket.send(eventName, data);
};

SyncList.prototype.sync = function(method) {
    if (!this.syncEnabled) {
        return;
    }

    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift('syncmodel.' + method);
    this.emitRemote.apply(this, args);
};

SyncList.prototype.fetchList = function() {
    this.emitRemote('synclist.fetch');
};

//--

module.exports = SyncList;

});
require.register('./src/xqcore-syncmodel.js', function(module, exports, require) { /**
 * XQCore Syncronniced module module
 *
 * @module XQCore.SyncModel
 * @requires XQCore.Model
 * @requires XQCore.Socket
 */
    'use strict';

var XQCore = require('./xqcore-core');


var SyncModel = function(name, conf) {
    /**
     * @property {Boolean} noAutoRegister Disables auto registration. SyncList.register() must be called manually to register the list at the socket server.
     */
    this.noAutoRegister = false;

    //Call XQCore.Model constructor
    XQCore.Model.call(this, name, conf);

    this.server = this.server || location.protocol + '//' + location.hostname;
    this.port = this.port || XQCore.socketPort;
    this.path = this.path || 'xqsocket';
    this.channel = this.channel || this.name.toLowerCase();
    this.syncEnabled = false;
    this.connectToSocket();
    if (!this.noAutoRegister) {
        this.register();
    }
};

SyncModel.prototype = Object.create(XQCore.Model.prototype);
SyncModel.prototype.constructor = SyncModel;

/**
 * Inherits a sync model prototype
 * @method inherit
 * @param  {String} name    model name
 * @param  {Object} options SyncModel properties
 * @return {Object}         Returns a XQCore.SyncModel prototype
 */
SyncModel.inherit = function(name, options) {
    if (typeof name === 'object') {
        options = name;
        name = undefined;
    }

    var Proto = function() {
        XQCore.SyncModel.call(this, name, options);
    };

    Proto.prototype = Object.create(XQCore.SyncModel.prototype);
    Proto.prototype.constructor = Proto;
    return Proto;
};

/**
 * Connect to a socket server
 *
 * @method connectToSocket
 */
SyncModel.prototype.connectToSocket = function() {
    var socketServer = this.server + ':' + this.port + '/' + this.path;
    if (!this.socket) {
        this.debug('Connect to socket:', socketServer);
        this.socket = new XQCore.Socket(socketServer, this.channel);
    }
};

SyncModel.prototype.register = function(enableSync) {
    var self = this;

    this.syncEnabled = !!enableSync;

    self.debug('Register syncmodel at server:', self.name);

    var opts = {
        noSync: true
    };

    self.socket.on('syncmodel.set', function(data) {
        self.set(data, opts);
    });

    self.socket.on('syncmodel.replace', function(data) {
        opts.replace = true;
        self.set(data, opts);
    });

    self.socket.on('syncmodel.item', function(key, value) {
        self.set(key, value, opts);
    });

    self.socket.on('syncmodel.insert', function(path, index, data) {
        self.insert(path, index, data, opts);
    });

    self.socket.on('syncmodel.remove', function(path, index, data) {
        self.remove(path, index, data, opts);
    });

    self.socket.on('syncmodel.reset', function() {
        self.reset(opts);
    });

    self.socket.on('syncmodel.init', function(data) {
        console.log('Got initial data request:', data);
        self.set(data, opts);
    });

    self.socket.send('syncmodel.register', {
        name: self.name
    });
};

SyncModel.prototype.unregister = function() {
    var modelName = this.conf.syncWith || this.name.replace(/Model$/,'');
    this.socket.send('syncmodel.unregister', {
        name: modelName
    });

    this.socket.off('syncmodel.set');
    this.socket.off('syncmodel.replace');
    this.socket.off('syncmodel.item');
    this.socket.off('syncmodel.insert');
    this.socket.off('syncmodel.remove');
    this.socket.off('syncmodel.reset');
    this.socket.off('syncmodel.init');
};

/**
 * Send a socket message to the server
 * @param  {String} eventName Event name
 * @param  {Object} data      Data object
 */
SyncModel.prototype.emitRemote = function(eventName, data) {
    this.socket.send(eventName, data);
};

SyncModel.prototype.sync = function(method) {
    if (!this.syncEnabled) {
        return;
    }

    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift('syncmodel.' + method);
    this.emitRemote.apply(this, args);
};

SyncModel.prototype.fetchModel = function() {
    this.emitRemote('syncmodel.fetch');
};

module.exports = SyncModel;

});
require.register('./src/xqcore-tmpl.js', function(module, exports, require) { /**
 * Template module
 *
 * @module XQCore.Tmpl
 */

'use strict';

var XQCore = require('./xqcore-core');
var FireTPL = require('firetpl');

var Tmpl = {
    type: 'firetpl',
    compile: FireTPL.compile,
    getTemplate: function(viewName, options) {
        options = options || {};
        if (FireTPL.templateCache && FireTPL.templateCache[viewName]) {
            return FireTPL.templateCache[viewName];
        }
        else if(!FireTPL.loadFile) {
            throw new Error('FireTPL runtime is being used. Please preload the ' + viewName + 'View');
        }
        else {
            var viewDir = options.viewDir || XQCore.viewsDir;
            var tmpl = FireTPL.readFile(viewDir.replace(/\/$/, '') + '/' + viewName + '.' + XQCore.viewExt.replace(/^\./, ''));
            return FireTPL.compile(tmpl, {
                eventAttrs: true
            });
        }
    }
};

//--

module.exports = Tmpl;

});
require.register('./src/xqcore-view.js', function(module, exports, require) { /**
 * XQCore View module
 *
 * A view renders a .fire or .hbs template and injects the result into the dom.
 *
 * @module XQCore.View
 * @returns {object} Returns a XQCore.View prototype object
 */
'use strict';

var XQCore = require('./xqcore-core');

var $ = require('jquery'),
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
    //Call Event constructor
    XQCore.Event.call(this);

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

XQCore.extend(View.prototype, XQCore.Event.prototype);

/**
 * Show view if it is invisible
 *
 * @method show
 * @param {Boolean} hideOther Hide all other sibling views
 * @chainable
 * @fires view.show Fires a v`view.show` event
 * @returns {Object} Returns this value
 */
View.prototype.show = function(hideOther) {
    var self = this;

    if (hideOther) {
        self.$ct.children('.xq-view').each(function() {
            if (this !== self.el) {
                var view = $(this).data('view');
                view.hide();
            }
        });
    }

    this.$el.show().removeClass('xq-hidden');
    this.emit('view.show');
    return this;
};

/**
 * Hide view
 * 
 * @method hide
 * @chainable
 * @fires view.hide Fires a v`view.hide` event
 * @return {Object} Returns this value
 */
View.prototype.hide = function() {
    this.$el.hide().addClass('xq-hidden');
    this.emit('view.hide');
    return this;
};

/**
 * Marks a view as active, optionally inactivates all other sibling views
 *
 * @method active
 * @param {Boolean} inactivateOther Makes all other sibling views inactive
 * @chainable
 * @fires view.active Fires a v`view.active` event
 * @returns {Object} Returns this value
 */
View.prototype.active = function(inactivateOther) {
    var self = this;

    if (inactivateOther) {
        self.$ct.children('.xq-view').each(function() {
            if (this !== self.el) {
                var view = $(this).data('view');
                view.inactive();
            }
        });
    }

    this.$el.addClass('xq-active').removeClass('xq-inactive');

    this.emit('view.active');
    return this;
};

/**
 * Marks a view as inactive
 * 
 * @method inactivate
 * @chainable
 * @fires view.inactive Fires a v`view.inactive` event
 * @return {Object} Returns this value
 */
View.prototype.inactive = function() {
    this.$el.removeClass('xq-active').addClass('xq-inactive');
    this.emit('view.inactive');
    return this;
};

View.prototype.renderHTML = function(template, data) {
    log.log('Render html snippet', template, 'with data:', data);
    template = typeof template === 'function' ? template : XQCore.Tmpl.compile(template);
    return template(data);
};

/**
 * To be called if window resizes
 * This is a placeholder method. Override this method if its needed
 *
 * @overridable
 * @return {Object} Returns this value
 */
View.prototype.resize = function() {
    return this;
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
 * If a validation succeeds (Automatically called in a coupled view)
 *
 * @method validationSucceeded
 * @param {String} name Input name
 * @param {String} value Input value
 */
View.prototype.validationSucceeded = function(name, value) {
    var self = this;

    self.$el.find('[name="' + name + '"]').removeClass('xq-invalid');
};

/**
 * To be called when a state.change event from a coupled model was revived
 *
 * @param {String} state Model state
 * @override
 */
View.prototype.onStateChange = function(state) {
    if (!this.el) {
        this.__initialState = state;
        return;
    }

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
    var isInDOM = this.isElementInDOM(this.ct);
    if (this.el.parentNode === this.ct && isInDOM) {
        return;
    }

    if (!isInDOM) {
        this.$ct = $(this.container);
        this.ct = this.$ct.get(0);
    }

    log.info('Inject view into container', this.$ct);

    if (this.mode === 'replace') {
        var childs = this.$ct.contents();
        childs.each(function() {
            var view = $(this).data('view');
            if (view) {
                view.detach();
            }
            else {
                $(this).detach();
            }
        });

        // this.$ct.contents().detach();
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
        log.error('View render error!', err);
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
 * @chainable
 * @emits content.change
 *
 * @param  {Object} data Render data
 * @returns {Object} Returns this value
 */
View.prototype._render = function(data) {
    if (this.__domReady === false) {
        this.__initialData = data || {};
        return this;
    }

    if (this.autoInject) {
        this.inject();
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
        log.error('View render error!', err);
    }

    this.el.innerHTML = html;
    this.emit('content.change', data);

    this.registerListener(this.$el);
    this.registerForms();

    return this;
};

/**
 * Render view
 *
 * @method render
 * @chainable
 * @emits content.change
 *
 * @param  {Object} data Render data
 * @returns {Object} Returns this value
 */
View.prototype.render = function(data) {
    if (this.__domReady === false) {
        this.__initialData = data || {};
        return this;
    }

    if (this.autoInject) {
        this.inject();
    }

    var html;

    log.info('Render view template of view ' + this.name, 'with data:', data);

    var template = typeof this.template === 'function' ? this.template : XQCore.Tmpl.compile(this.template);
    
    this.scopes = {
        dataFn: function(path, data) {
            var d = data[path];
            if (d === null || d === undefined) {
                d = '';
            }

            return '<ftl path="' + path + '">'+d+'</ftl>';
        },
        scopeFn: function(scopeId, path, data) {
            if (path === 'data' && Array.isArray(data)) {
                path = '_ftl_root';
            }

            return '<ftl scope="' + scopeId + '" path="' + path + '"></ftl>';
        },
        attrFn: function(attr, value) {
            var val1 = value.replace(/<ftl path="([a-zA-Z0-9_.-]+)">(.+?)<\/ftl>/g, function(str, p1, p2) {
                return p2;
            });

            var val2 = value.replace(/<ftl path="([a-zA-Z0-9_.-]+)">(.+?)<\/ftl>/g, function(str, p1, p2) {
                return '%s';
            });

            var attrs = attr + '="' + val1 + '" xq-' + attr + '="' + val2 + '"';
            return attrs;
        }
    };

    try {
        html = template(data || {}, this.scopes);
    }
    catch(err) {
        html = '<p class="renderError"><b>View render error!</b><br>' + err.message + '</p>';
        log.error('View render error!', err);
    }

    this.el.innerHTML = html;
    var self = this;
    this.scopesMap = {};

    //Replace scopes
    this.$el.find('ftl').each(function() {
        var scope = $(this).attr('scope');
        var path = $(this).attr('path');
        if (scope) {
            self.replaceScopes($(this), scope, data, path, path);
        }
        else {
            self.replaceNode($(this), path);
        }
    });

    this.emit('content.change', data);

    this.registerListener(this.$el);
    this.registerForms();

    return this;
};

View.prototype.replaceScopes = function($el, scope, data, path, fullPath) {
    var self = this;
    var scopeData = path && path !== '_ftl_root' ? data[path] : data;
    var html = self.scopes[scope](scopeData, data);
    var $html = $($.parseHTML(html));
    var $parent = $el.parent();

    //Replace scopes
    $html.find('ftl').each(function() {
        var scope = $(this).attr('scope');
        var path = $(this).attr('path');
        if (scope) {
            self.replaceScopes($(this), scope, scopeData, path, fullPath + (Array.isArray(scopeData) ? '[].' : '.') + path);
        }
        else {
            self.replaceNode($(this), fullPath + (Array.isArray(scopeData) ? '[].' : '.') + path);
        }
    });

    $el.replaceWith($html);

    if (fullPath.indexOf('[].') !== -1) {
        return;
    }

    if (!(fullPath in self.scopesMap)) {
        self.scopesMap[fullPath] = [];
    }

    var splitItems = function($html) {
        if (!Array.isArray(scopeData)) {
            return [$html];
        }
        var len = $html.length / scopeData.length;
        var out = [];
        
        var next = [];
        $html.each(function() {
            next.push($(this).get(0));
            if (next.length === len) {
                out.push(next);
                next = [];
            }
        });

        return out;
    };

    self.scopesMap[fullPath].push({
        type: 'scope',
        fn: self.scopes[scope],
        childs: splitItems($html, scopeData),
        parentData: data,
        parent: $parent
    });
};

View.prototype.replaceNode = function($el, fullPath) {
    var self = this;
    var nodeData = $el.html();

    var node = document.createTextNode(nodeData);
    $el.replaceWith(node);

    if (fullPath.indexOf('[].') !== -1) {
        return;
    }

    if (!(fullPath in self.scopesMap)) {
        self.scopesMap[fullPath] = [];
    }

    self.scopesMap[fullPath].push({
        type: 'node',
        node: node
    });
};

View.prototype.renderScope = function(scope, path, data) {
    var self = this;
    var html = $.parseHTML(scope.fn(data, scope.parentData));
    var $html = $(html);
    $html.find('ftl').each(function() {
        var scope = $(this).attr('scope');
        var path = $(this).attr('path');
        if (scope) {
            self.replaceScopes($(this), scope, data, path, path);
        }
        else {
            self.replaceNode($(this), path);
        }
    });

    this.registerListener($html);

    return $html;
};

View.prototype.renderNode = function(scope, path, data) {
    scope.node.nodeValue = data;
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
                };
            }
            else {
                listenerFunc = function(e) {
                    var value;

                    if (e.originalEvent instanceof KeyboardEvent) {
                        value = {
                            key: e.key,
                            code: e.keyCode,
                            alt: e.altKey,
                            ctrl: e.ctrlKey,
                            meta: e.metaKey,
                            shift: e.shiftKey
                        };
                    }
                    else if (e.originalEvent instanceof MouseEvent) {
                        e.preventDefault();
                        value = {
                            button: e.button,
                            alt: e.altKey,
                            ctrl: e.ctrlKey,
                            meta: e.metaKey,
                            shift: e.shiftKey
                        };

                        if (e.type === 'click' && e.currentTarget.href) {
                            value.href = e.currentTarget.href;
                        }

                    } else {
                        e.preventDefault();
                        value = e.currentTarget.value || '';
                    }

                    self.emit(ev[1], value, data, e);
                };
            }

            $cur.bind(ev[0], listenerFunc);
        });
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
    if (path in this.scopesMap) {
        this.scopesMap[path].forEach(function(scope) {
            var $html = self.renderScope(scope, path, [data]);
            if (index === -1) {
                scope.parent.append($html);
                scope.childs.push([$html.get()]);
            }
            else if (index === 0) {
                scope.parent.prepend($html);
                scope.childs.unshift([$html.get()]);
            }
            else {
                var els = scope.childs[index];
                $(els[0]).before($html);
                var args = [index, 0].concat([$html.get()]);
                scope.childs.splice.apply(scope.childs, args);
            }
        });
    }
};

View.prototype.update = function(path, data) {
    log.warn('XQCore doesn`t support update events yet');
};

View.prototype.append = function(path, data) {
    if (arguments.length === 1) {
        data = path;
        path = 'data';
    }

    this.insert(path, -1, data);
};

View.prototype.prepend = function(path, data) {
    if (arguments.length === 1) {
        data = path;
        path = 'data';
    }

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
    if (path in this.scopesMap) {
        this.scopesMap[path].forEach(function(scope) {
            var els = scope.childs[index];
            if (Array.isArray(els)) {
                els.forEach(function(el) {
                    $(el).remove();
                });
            }
            else {
                $(els).remove();
            }

            scope.childs.splice(index, 1);
        });
    }
};

View.prototype.removeLast = function(path) {
    log.warn('XQCore doesn`t support pop events yet');
};

View.prototype.removeFirst = function(path) {
    log.warn('XQCore doesn`t support shift events yet');
};

View.prototype.change = function(path, value) {
    var self = this;

    this.ready(function() {
        if (path in this.scopesMap) {
            this.scopesMap[path].forEach(function(scope) {
                if (scope.type === 'node') {
                    self.renderNode(scope, path, value);
                }
            });
        }
    });
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
        // var errClassName = 'xq-invalid',
            // disabledClass = 'xq-disabled';

        // if (!$el) {
        //     $el = this.$el.find('form');
        // }

        var changeHandler = function(e) {
            var value = e.target.value;
            var name = e.target.name;
            
            self.emit('input.change', name, value);
        };

        var keyUpHandler = function(e) {
            var value = e.target.value;
            var name = e.target.name;
            
            self.emit('input.edit', name, value);
        };

        var submitHandler = function(e) {
            e.preventDefault();
            var data = self.serializeForm(e.target);
            self.emit('form.submit', data);
        };

        this.addEvent(':input', 'change', changeHandler);
        this.addEvent(':input', 'keyup', keyUpHandler);
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
 * Removes a view from dom but does not unreister its DOM event listener.
 * This is usefull if you wish to add this view later back into the DOM.
 * Uncouples itself from a coupled model or list.
 *
 * @method  detach
 *
 * @fires view.detach Fires a `view.detach` event before view is removing from dom.
 * @return {[type]} [description]
 */
View.prototype.detach = function() {
    log.info('Destroy view');

    this.emit('view.detach');

    this.$el.detach();

    if (this.__coupled) {
        //Uncouple other participate
        if (this.__coupled.obj.__coupled && this.__coupled.obj.__coupled.obj === this) {
            this.__coupled.obj.__coupled.uncouple();
        }
        
        this.__coupled.uncouple();
    }

    //TODO remove all events
    
    log.info('View ' + this.name + ' has been destroyed');
};

/**
 * Removes a view from dom and unregisters all its listener
 *
 * @fires view.destroy Fires a `view.destroy` event before view is removing from dom.
 * @return {[type]} [description]
 */
View.prototype.destroy = function() {
    log.info('Destroy view');

    this.emit('view.destroy');

    this.$el.remove();

    if (this.__coupled) {
        //Uncouple other participate
        if (this.__coupled.obj.__coupled && this.__coupled.obj.__coupled.obj === this) {
            this.__coupled.obj.__coupled.uncouple();
        }
        
        this.__coupled.uncouple();
    }

    //TODO remove all events
    
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
        self.$el.data('view', self);
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

        // if (self.autoInject) {
        //     self.inject();
        // }

        //Set ready state
        self.__setReadyState();
        self.registerListener(self.$el);

        //Register view listener
        if (XQCore.html5Routes) {
            self.$el.on('click', 'a', function(e) {
                if (/^http(s)?:\/\//.test(e.currentTarget.href)) {
                    return;
                }

                if (!/^\/?[a-z]/.test(e.currentTarget.href)) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();

                self.emit('xqcore.navigate', e.currentTarget.href);
            });
        }

        if (self.forms) {
            self.formSetup();
        }

        if (self.__initialState) {
            self.onStateChange(self.__initialState);
            delete self.__initialState;
        }
    });
};

View.prototype.registerForms = function() {
    if (this.forms) {
        var formSelector = 'form';
        if (typeof this.forms === 'string') {
            formSelector = this.forms;
        }
        
        this.ready(function() {
            this.$forms = this.$el.find(formSelector);
            this.$forms.addClass('xq-forms');
            this.$forms.find(':input').addClass('xq-input');
        });
    }
};

/**
 * Checks whether an element is in the DOM or not.
 *
 * @private
 * @param  {Object}  el DOM element wich sholld be checked
 * @return {Boolean}    Returns true if element is still in the DOM
 */
View.prototype.isElementInDOM = function(el) {
    while (el) {
        if (el === document.body) {
            return true;
        }

        el = el.parentNode;
    }

    return false;
};

//--

module.exports = View;

});
require.register('./src/xqcore-component.js', function(module, exports, require) { /**
 * XQCore Component module
 *
 * A view renders a .fire or .hbs template and injects the result into the dom.
 *
 * @module Component
 * @returns {object} Returns a XQCore.Component prototype object
 */
'use strict';

var Logger = require('./xqcore-logger');
var EventEmitter = require('./xqcore-event');
var cmpElements = {
  Core: require('./components/core'),
  Input: require('./components/input'),
  List: require('./components/list'),

  NotFoundElement: require('./components/notFound'),
  PageSection: require('./components/pageSection'),
  PageRoot: require('./components/pageRoot'),
  PageHeader: require('./components/pageHeader'),
  PageFooter: require('./components/pageFooter')
};

var log;

/**
 * XQCore.Component
 *
 * @class Component
 * @constructor
 *
 * @param {object} conf Component configuration
 */
function Component(tag, name) {
  EventEmitter.call(this);

  log = new Logger(tag + 'Component');

  log.debug('Create new view');
  if (!cmpElements[tag]) {
    tag = 'NotFoundElement';
  }

  var el = new cmpElements[tag](name);
  el.create();
  this.el = el;

  this.registerEventListener();
}

Component.prototype = Object.create(EventEmitter.prototype);
Component.prototype.constructor = Component;

/**
 * Sets a view state
 * @param {[type]} state [description]
 */
Component.prototype.setState = function (state) {
  if (this.state) {
    this.removeClass('state-' + this.state);
  }

  this.state = state;
  this.addClass('state-' + this.state);
  return this;
};

Component.prototype.appendTo = function(container) {
  container.appendChild(this.el.domEl);
};

Component.prototype.toHTML = function () {
  return this.el.domEl.outerHTML;
};

Component.prototype.push = function(item) {
  this.el.push(item);
}

Component.prototype.registerEventListener = function() {
  if (this.el.$change) {
    var self = this;
    this.el.$change(function(data, ev) {
      self.emit('value.change', data);
    });
  }
}

/**
 * Sets component state
 * @method setState
 * @version 1.0.0
 *
 * @param {string} state State name
 */
Component.prototype.setState = function(state) {
  if (state === 'valid') {
    this.removeClass('xq-invalid');
  }
  else if (state === 'invalid') {
    this.removeClass('xq-valid');
  }

  this.addClass('xq-' + state);
};

Component.prototype.addClass = function (className) {
  var classList = this.el.domEl.className;
  if (!classList) {
    this.el.domEl.className = className;
    return;
  }

  var reg = new RegExp('\\b' + className + '\\b');
  if (!reg.test(classList)) {
    this.el.domEl.className += ' ' + className
  }
};

Component.prototype.removeClass = function (className) {
  var classList = this.el.domEl.className;
  var reg = new RegExp(' ?\\b' + className + '\\b ?');
  this.el.domEl.className = classList.replace(reg, '');
};

Component.prototype.setError = function(err) {
  this.el.domEl.title = err;
};

/*
class XQComponent {
  constructor(tag) {
    log = new Logger(tag + 'Component');

    log.debug('Create new view');
    if (!HTMLElements[tag]) {
      tag = 'NotFoundElement';
    }

    let el = new HTMLElements[tag]();
    el.create();
    this.el = el;
  }

  injectInto(domSelector) {
    domSelector.appendChild(this.el.el);
  }

  append(el) {
    if (Array.isArray(el)) {
      for (var i = 0; i < el.length; i++) {
        this.el.el.appendChild(el[i].el.el);
      }

      return;
    }

    this.el.el.appendChild(el.el.el);
  }

  static registerHTMLComponent(name, component) {
    HTMLElements[name] = component;
  }
}
*/
//--

module.exports = Component;

});
require.register('./src/components/core.js', function(module, exports, require) { /**
 * Core element
 * Represents the root element. All elements inherits from this element
 *
 * @package XQCore
 * @module ViewElements
 * @submodule Core
 * @class Core
 */
function Core() {
  this.tag = 'section';
}

/**
 * Creates the element
 * @method create
 * @chainable
 * @return {object} Returns this value
 */
Core.prototype.create = function() {
  var tagName = this.constructor.name;
  this.domEl = document.createElement(this.tag);
  var cssClass = tagName;
  if (this.cssClass) {
    cssClass += ' ' + this.cssClass;
  }

  if (this.attrs) {
    for (var attr in this.attrs) {
      if (this.attrs.hasOwnProperty(attr)) {
        this.domEl.setAttribute(attr, this.attrs[attr]);
      }
    }
  }

  this.domEl.className = cssClass;
  this.render({});
}

/**
 * Renders the elements content
 * @method render
 *
 * @param {object} data Render data
 *
 * @chainable
 * @return {object} Returns this value
 */
Core.prototype.render = function(data) {
  var html;
  if (this.tmpl) {
    html = this.tmpl;
  }

  if (typeof html === 'function') {
    html = html(data);
  }

  if (typeof html === 'object') {
    while (this.domEl.firstChild) {
      this.domEl.removeChild(this.domEl.firstChild);
    }

    this.domEl.appendChild(html);
  } else {
    this.domEl.innerHTML = html;
  }

  return this;
}

/**
 * Append one or multiple elements
 *
 * @method append
 * @param  {Object|Array} el Elements to been append
 *
 * @chainable
 * @return {Object}    Returns this value
 */
Core.prototype.append = function(el) {
  var i;

  if (Array.isArray(el)) {
    for (i = 0; i < el.length; i++) {
      this.domEl.appendChild(el[i].domEl);
    }

    return;
  }
  else if (typeof el === 'string') {
    var docFrac = document.createDocumentFragment();
    var div = document.createElement('div');
    div.innerHTML = el;
    for (i = 0; i < div.children.length; i++) {
      docFrac.appendChild(div.children[i]);
    }

    this.domEl.appendChild(docFrac);
  }
  else {
    this.domEl.appendChild(el.domEl);
  }

  return this;
}

module.exports = Core;

});
require.register('./src/components/input.js', function(module, exports, require) { var Core = require('./core');

function Input (name) {
  Core.call(this);

  var self = this;
  this.tag = 'div';
  this.tmpl = function(data) {
    self.errorLabel = document.createElement('span');
    self.errorLabel.className = 'error-label';

    self.inputField = document.createElement('input');
    self.inputField.className = 'xq-input-field';
    self.inputField.setAttribute('type', self.type);
    self.inputField.setAttribute('name', self.name);

    var docFrag = document.createDocumentFragment();
    docFrag.appendChild(self.errorLabel);
    docFrag.appendChild(self.inputField);
    return docFrag;
  }

  this.name = name || 'input';
  this.type = 'text';
  this.cssClass = 'xq-input';
}

Input.prototype = Object.create(Core.prototype);
Input.prototype.constructor = Input;

Input.prototype.$change = function(fn) {
  this.domEl.addEventListener('change', function(ev) {
    console.log('CHANGE', ev);
    fn({
      name: ev.target.name,
      value: ev.target.value
    }, ev);
  });
}

Input.prototype.setError = function (err) {
  this.errorLabel.innerHTML = err;
};

Input.prototype.getValue = function () {
  return this.inputField.value;
};

Input.prototype.setValue = function (value) {
  return this.inputField.value = value;
};

module.exports = Input;

});
require.register('./src/components/list.js', function(module, exports, require) { var Core = require('./core');

function List() {
  Core.call(this);

  this.tag = 'ul';
  this.cssClass = 'xq-list';

  this.attrs = {
    type: 'text'
  };

  this.item = function(data) {
    return '<li class="item">' + data.value + '</li>';
  };
}

List.prototype = Object.create(Core.prototype);
List.prototype.constructor = List;

List.prototype.render = function(data) {
  if (Array.isArray(data)) {
    data.forEach(function(item) {
      this.push(item);
    }, this);
  }
}

List.prototype.push = function(data) {
  var item = this.item;
  this.append(item(data));
}

List.prototype.child = function (el) {
  if (typeof el === 'string') {
    this.item = function(data) {
      return '<li>' + data.value + '</li>';
    };
  }
  else {
    this.item = el.render;
  }
};

module.exports = List;

});
require.register('./src/components/notFound.js', function(module, exports, require) { let RootElement = require('./root');

class NotFoundElement extends RootElement {
  constructor() {
    super();

    this.className = 'element-error element-not-found'
    this.attrs = {
      title: 'Element was not found!'
    }
  }
}

module.exports = NotFoundElement;

});
require.register('./src/components/root.js', function(module, exports, require) { let EventEmitter = require('../xqcore-event');

/**
 * Root element
 *
 * @class RootElement
 * @extends XQFire.Event
 */
class RootElement extends EventEmitter {

  /**
   * Element constructor
   *
   * @chainable
   * @return {object} Returns this value
   */
  constructor() {
    super();
    this.tag = 'section'
  }

  /**
   * Creates dom element
   *
   * @chainable
   * @return {object} Returns this value
   */
  create() {
    let tagName = this.constructor.name;
    this.el = document.createElement(this.tag);
    this.el.className = tagName;
    this.render({});

    if (this.$change) {
      this.el.addEventListener('change', ev => {
        this.emit('change', this.$change(ev), ev);
      });
    }
  }

  append(el) {
    if (Array.isArray(el)) {
      for (var i = 0; i < el.length; i++) {
        this.el.appendChild(el[i].el);
      }

      return;
    }
    else if (typeof el === 'string') {
      let docFrac = document.createDocumentFragment();
      let div = document.createElement('div');
      div.innerHTML = el;
      for (let item of div.children) {
        docFrac.appendChild(item);
      }
      this.el.appendChild(docFrac);
    }
    else {
      this.el.appendChild(el.el);
    }
  }

  render(data) {
    if (this.tmpl) {
      let html = this.tmpl;
      if (typeof html === 'function') {
        html = html(data);
      }

      this.el.innerHTML = html;
    }
  }
}

module.exports = RootElement

});
require.register('./src/components/pageSection.js', function(module, exports, require) { let RootElement = require('./root');

class PageSection extends RootElement {
  constructor() {
    super();
  }
}

module.exports = PageSection;

});
require.register('./src/components/pageRoot.js', function(module, exports, require) { let RootElement = require('./root');

class PageRoot extends RootElement {
  constructor() {
    super();
  }
}

module.exports = PageRoot;

});
require.register('./src/components/pageHeader.js', function(module, exports, require) { let RootElement = require('./root');

class PageHeader extends RootElement {
  constructor() {
    super();

    this.tag = 'header';
  }
}

module.exports = PageHeader;

});
require.register('./src/components/pageFooter.js', function(module, exports, require) { let RootElement = require('./root');

class PageFooter extends RootElement {
  constructor() {
    super();

    this.tag = 'footer';
  }
}

module.exports = PageFooter;

});
require.register('./src/xqcore-utils.js', function(module, exports, require) { /**
 * Extends XQCore with some usefull functions
 *
 * @module  XQCore.Utils
 */
'use strict';

var XQCore = require('./xqcore-core');

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

/**
 * Creates a unique id
 *
 * @param {Number} len (Optional) String length. Defaults to 7
 * @returns {String} Unique string
 */
XQCore.uid = function(len) {
  len = len || 7;
  var str = '';

  while (str.length < len) {
    var part = Math.random().toString(36).substr(2);
    str += part;
  }

  return str.substr(0, len);
};

/**
 * Returns a promise object
 *
 * the returning object has two extra methods
 *
 * `resolve` to resolv the promise
 * `reject` to reject the promise
 *
 * If callback is set it will be called, when promise will be resolved or rejected.
 * Gets the reject data as first argument and the resolve data as second argument
 *
 * @example {js}
 * var promise = XQCore.promise();
 * promise.then(function() {
 *     console.log('Resolve');
 * });
 *
 * setTimeout(function() {
 *     promise.resolve();
 * }, 100);
 *
 * @method promise
 * @param  {Function} [callback] Callback function, to be called on resolv or rejecting the promise
 * @return {Object} Returns a promise object
 */
XQCore.promise = function(callback) {

  var s, r;
  var promise = new XQCore.Promise(function(resolve, reject) {
    s = resolve;
    r = reject;
  });

  promise.resolve = function(data) {
    s(data);
    if (typeof callback === 'function') {
      callback(null, data);
    }

    return promise;
  };

  promise.reject = function(data) {
    r(data);
    if (typeof callback === 'function') {
      callback(data);
    }

    return promise;
  };

  var chain = [];

  promise.push = function(fn) {
    if (typeof fn !== 'function') {
      throw new Error('Could not create a promise chain! First arg is not a function in promise.push().');
    }

    chain.push(fn);
    return this;
  };

  promise.each = function(data) {
    var p = chain.shift();
    if (!p) {
      promise.resolve(data);
      return;
    }

    p(data).then(function(data) {
      promise.each(data);
    }).catch(function(err) {
      promise.reject(err);
    });

    return promise;
  };

  return promise;
};

/**
 * Walks recursive through a nested object tree
 * @param  {object|array}  tree Tree object
 * @param  {Function} fn   Call function on each item
 * @return {object|array}  Returns a resolved tree response
 */
XQCore.recurse = function(tree, fn) {
  var res;
  var i;
  if (Array.isArray(tree)) {
    res = [];

    for (i = 0; i < tree.length; i++) {
       res.push(fn(tree[i], function(data) {
         return XQCore.recurse(data, fn)
       }));
    }

    return res;
  }
  else if (tree && typeof tree === 'object') {
    var keys = Object.keys(tree);
    res = {};

    for (i = 0; i < keys.length; i++) {
       res[keys]= fn(tree[keys[i]], fn);
    }

    return res;
  }

};

});
return require('./xqcore-init.js');

}));

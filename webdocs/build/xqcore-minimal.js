/*!
 * XQCore Minimal - 0.4.3
 * 
 * Model View Presenter Javascript Framework
 *
 * XQCore is licenced under MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Copyright (c) 2012 - 2013 Noname Media, http://noname-media.com
 * Author Andi Heinkelein
 *
 * Creation Date: 2013-07-24
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('xqcore', ['jquery'], factory);
    } else {
        root.XQCore = factory(root.jQuery);
    }
}(this, function (jQuery) {


/*jshint evil:true */
/*global XQCore:true */

/**
 * XQCore main object
 *
 * @package XQcore
 * @type {Object}
 */
var XQCore = {
	version: '0.4.3',
	defaultRoute: 'default',
	html5Routes: false,
	hashBang: '#!',
	callerEvent: 'callerEvent'
};

// if (typeof define === "function" && define.amd) {
// 	console.log('XQCore: using AMD style');
// 	define( "xqcore", ['handlebars'], function (Handlebars) {
// 		XQCore.TemplateEngine = Handlebars;
// 		return XQCore;
// 	});
// } else {
// 	XQCore.TemplateEngine = window.Handlebars;
// 	window.XQCore = XQCore;
// }

/**
 * Implement include support
 *
 * File must be absolute to the document root
 *
 * @param {String} file Filename to be load
 */
if (!window.include) {
	window.include = function(file, callback) {
		var url = location.protocol + '//' + location.host + file;
		$.ajax({
			url: url,
			dataType: "script",
			success: callback,
			async: false
		});
	};

	window.preload = function(file) {
		var url = location.protocol + '//' + location.host + file,
			script;

		$.ajax({
			url: url,
			dataType: "text",
			success: function(data) {
				script = data;
			},
			async: false
		});

		return {
			execute: function(scope) {
				eval.call(scope || window, script);
			}
		};
	};
}


XQCore._dump = {};
XQCore.dump = function(componentName) {
	if (XQCore._dump[componentName]) {
		console.log('[XQCore dump]', componentName, XQCore._dump[componentName]);
		return XQCore._dump[componentName];
	}

	return false;
};
/**
 * XQCore EventEmitter
 *
 * Based on EventEmitter v4.0.2 by Oliver Caldwell
 * http://git.io/ee
 *
 */
XQCore.Event = (function() {

	//EventEmitter.js

	/**
	 * EventEmitter v4.0.2 - git.io/ee
	 * Oliver Caldwell
	 * MIT license
	 */

	var EventEmitter = (function() {
	    // JSHint config - http://www.jshint.com/
	    /*jshint laxcomma:true*/

	    // Place the script in strict mode
	    'use strict';

	    /**
	     * Class for managing events.
	     * Can be extended to provide event functionality in other classes.
	     *
	     * @class Manages event registering and emitting.
	     */
	    function EventEmitter(){}

	    // Shortcuts to improve speed and size

	        // Easy access to the prototype
	    var proto = EventEmitter.prototype

	      // Existence of a native indexOf
	      , nativeIndexOf = Array.prototype.indexOf ? true : false;

	    /**
	     * Finds the index of the listener for the event in it's storage array
	     *
	     * @param {Function} listener Method to look for.
	     * @param {Function[]} listeners Array of listeners to search through.
	     * @return {Number} Index of the specified listener, -1 if not found
	     */
	    function indexOfListener(listener, listeners) {
	        // Return the index via the native method if possible
	        if(nativeIndexOf) {
	            return listeners.indexOf(listener);
	        }

	        // There is no native method
	        // Use a manual loop to find the index
	        var i = listeners.length;
	        while(i--) {
	            // If the listener matches, return it's index
	            if(listeners[i] === listener) {
	                return i;
	            }
	        }

	        // Default to returning -1
	        return -1;
	    }

	    /**
	     * Returns the listener array for the specified event.
	     * Will initialise the event object and listener arrays if required.
	     *
	     * @param {String} evt Name of the event to return the listeners from.
	     * @return {Function[]} All listener functions for the event.
	     * @doc
	     */
	    proto.getListeners = function(evt) {
	        // Create a shortcut to the storage object
	        // Initialise it if it does not exists yet
	        var events = this._events || (this._events = {});

	        // Return the listener array
	        // Initialise it if it does not exist
	        return events[evt] || (events[evt] = []);
	    };

	    /**
	     * Adds a listener function to the specified event.
	     * The listener will not be added if it is a duplicate.
	     * If the listener returns true then it will be removed after it is called.
	     *
	     * @param {String} evt Name of the event to attach the listener to.
	     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	     * @return {Object} Current instance of EventEmitter for chaining.
	     * @doc
	     */
	    proto.addListener = function(evt, listener) {
	        // Fetch the listeners
	        var listeners = this.getListeners(evt);

	        // Push the listener into the array if it is not already there
	        if(indexOfListener(listener, listeners) === -1) {
	            listeners.unshift(listener);
	        }

	        // Return the instance of EventEmitter to allow chaining
	        return this;
	    };

	    /**
	     * Removes a listener function from the specified event.
	     *
	     * @param {String} evt Name of the event to remove the listener from.
	     * @param {Function} listener Method to remove from the event.
	     * @return {Object} Current instance of EventEmitter for chaining.
	     * @doc
	     */
	    proto.removeListener = function(evt, listener) {
	        // Fetch the listeners
	        // And get the index of the listener in the array
	        var listeners = this.getListeners(evt)
	          , index = indexOfListener(listener, listeners);

	        // If the listener was found then remove it
	        if(index !== -1) {
	            listeners.splice(index, 1);

	            // If there are no more listeners in this array then remove it
	            if(listeners.length === 0) {
	                this._events[evt] = null;
	            }
	        }

	        // Return the instance of EventEmitter to allow chaining
	        return this;
	    };

	    /**
	     * Adds listeners in bulk using the manipulateListeners method.
	     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	     * You can also pass it an event name and an array of listeners to be added.
	     *
	     * @param {String|Object} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	     * @param {Function[]} [listeners] An optional array of listener functions to add.
	     * @return {Object} Current instance of EventEmitter for chaining.
	     * @doc
	     */
	    proto.addListeners = function(evt, listeners) {
	        // Pass through to manipulateListeners
	        return this.manipulateListeners(false, evt, listeners);
	    };

	    /**
	     * Removes listeners in bulk using the manipulateListeners method.
	     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	     * You can also pass it an event name and an array of listeners to be removed.
	     *
	     * @param {String|Object} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	     * @param {Function[]} [listeners] An optional array of listener functions to remove.
	     * @return {Object} Current instance of EventEmitter for chaining.
	     * @doc
	     */
	    proto.removeListeners = function(evt, listeners) {
	        // Pass through to manipulateListeners
	        return this.manipulateListeners(true, evt, listeners);
	    };

	    /**
	     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	     * The first argument will determine if the listeners are removed (true) or added (false).
	     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	     * You can also pass it an event name and an array of listeners to be added/removed.
	     *
	     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	     * @param {String|Object} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	     * @return {Object} Current instance of EventEmitter for chaining.
	     * @doc
	     */
	    proto.manipulateListeners = function(remove, evt, listeners) {
	        // Initialise any required variables
	        var i
	          , value
	          , single = remove ? this.removeListener : this.addListener
	          , multiple = remove ? this.removeListeners : this.addListeners;

	        // If evt is an object then pass each of it's properties to this method
	        if(typeof evt === 'object') {
	            for(i in evt) {
	                if(evt.hasOwnProperty(i) && (value = evt[i])) {
	                    // Pass the single listener straight through to the singular method
	                    if(typeof value === 'function') {
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
	            while(i--) {
	                single.call(this, evt, listeners[i]);
	            }
	        }

	        // Return the instance of EventEmitter to allow chaining
	        return this;
	    };

	    /**
	     * Removes all listeners from a specified event.
	     * If you do not specify an event then all listeners will be removed.
	     * That means every event will be emptied.
	     *
	     * @param {String} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	     * @return {Object} Current instance of EventEmitter for chaining.
	     * @doc
	     */
	    proto.removeEvent = function(evt) {
	        // Remove different things depending on the state of evt
	        if(evt) {
	            // Remove all listeners for the specified event
	            this._events[evt] = null;
	        }
	        else {
	            // Remove all listeners in all events
	            this._events = null;
	        }

	        // Return the instance of EventEmitter to allow chaining
	        return this;
	    };

	    /**
	     * Emits an event of your choice.
	     * When emitted, every listener attached to that event will be executed.
	     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	     * So they will not arrive within the array on the other side, they will be separate.
	     *
	     * @param {String} evt Name of the event to emit and execute listeners for.
	     * @param {Array} [args] Optional array of arguments to be passed to each argument.
	     * @return {Object} Current instance of EventEmitter for chaining.
	     * @doc
	     */
	    proto.emitEvent = function(evt, args) {
	        // Get the listeners for the event
	        // Also initialise any other required variables
	        var listeners = this.getListeners(evt)
	          , i = listeners.length
	          , response;

	        // Loop over all listeners assigned to the event
	        // Apply the arguments array to each listener function
	        while(i--) {
	            // If the listener returns true then it shall be removed from the event
	            // The function is executed either with a basic call or an apply if there is an args array
	            response = args ? listeners[i].apply(null, args) : listeners[i]();
	            if(response === true) {
	                this.removeListener(evt, listeners[i]);
	            }
	        }

	        // Return the instance of EventEmitter to allow chaining
	        return this;
	    };

	    return EventEmitter;
	}());

	//End EventEmitter.js


	var ee,
		event;
	
	function indexOf(eventName, callback) {
		this.objectName = 'XQCore.Event';
		
		var len = this.store.length,
			i = 0,
			el;

		for (; i < len; i++) {
			el = this.store[i];
			if (eventName === null || eventName === el.event && callback === null || callback === el.callback) {
				return el;
			}
		}

		return null;
	}


	event = function(conf) {
		this.store = [];
		this.ee = new EventEmitter();
	};

	// event.prototype.on = function(eventName, callback) {

	// };

	// event.prototype.once = function(eventName, callback) {

	// };

	// event.prototype.emit = function(eventName, data) {

	// };

	// event.prototype.remove = function(eventName, callback) {

	// };

	event.prototype.emit = function(eventName, data) {
		if (this.debug) {
			console.debug('XQCore - Emit event', eventName, data);
		}
		return this.ee.emitEvent(eventName, [data], this);
	};

	event.prototype.on = function(eventName, listener) {
		if (this.debug) {
			console.debug('XQCore - Add listener', eventName, listener, this);
		}
		return this.ee.addListener(eventName, listener);
	};

	event.prototype.once = function(eventName, listener) {
		var onceListener = function() {
			this.ee.removeListener(eventName, listener);
			listener.apply(null, arguments);
			return true;
		}.bind(this);

		if (this.debug) {
			console.debug('XQCore - Add once listener', eventName, listener);
		}
		return this.ee.addListener(eventName, onceListener);
	};

	event.prototype.off = function(eventName, listener) {
		if (this.debug) {
			console.debug('XQCore - Remove listener', eventName, listener);
		}

		if (listener === undefined) {
			return this.ee.removeEvent(eventName);
		}
		else {
			return this.ee.removeListener(eventName, listener);
		}
	};

	event.prototype.removeAllListener = function() {
		if (this.debug) {
			console.debug('XQCore - Clear all listener');
		}

		return this.ee.removeEvent();
	};

	event.prototype.getListeners = function(eventName) {
		return this.ee.getListeners(eventName);
	};

	return event;
})();

/**
 * XQCore Logger
 *
 * Based on EventEmitter.js
 * 
 * 
 */
XQCore.Logger = (function(conf) {

	//var timerStore = {};

	function getHumanTime(time) {
		if (time < 1000) {
			return time + ' ms';
		}
		else if (time < 60000) {
			return (Math.round(time / 100) / 10) + ' sec';
		}
		else {
			return (Math.round(time / 60000)) + ' min ' + Math.round(time % 60000 / 1000) + ' sec';
		}
	}

	function onScreenConsole() {
		var conf,
			html;

		conf = localStorage.get('xqcore-onscreen-console') || {
			pos: 'bottom'
		};

		html = '<div id="XQCoreLogger-OnScreenConsole">\
			</div>';
	}

	/**
	 * XQCore Logger is a logging tool to log messages, warnings, errors to the browser or onscreen console
	 *
	 * @module XQCore.Logger
	 * @class XQCore.Logger
	 *
	 */
	var logger = function() {
		
	};

	/**
	 * Loggs a message to the console
	 *
	 * @method log
	 *
	 * @param {Any} msg logs all arguments to the console
	 */
	logger.prototype.log = function() {
		var args;

		if (this.debug) {
			args = Array.prototype.slice.call(arguments);
			args.unshift('[' + this.name + ']');
			console.log.apply(console, args);
		}
	};

	/**
	 * Loggs a warning to the console
	 *
	 * @method warn
	 * @param {Any} msg logs all arguments to the console
	 */
	logger.prototype.warn = function() {
		var args;

		if (this.debug) {
			args = Array.prototype.slice.call(arguments);
			args.unshift('[' + this.name + ']');
			console.warn.apply(console, args);
		}
	};

	/**
	 * Loggs a error message to the console
	 *
	 * @method error
	 * @param {Any} msg logs all arguments to the console
	 */
	logger.prototype.error = function() {
		var args;

		if (this.debug) {
			args = Array.prototype.slice.call(arguments);
			args.unshift('[' + this.name + ']');
			console.error.apply(console, args);
		}
	};

	/**
	 * Start a timeTracer
	 *
	 * @method timer
	 * @param {String} timerName Set the name for your (Optional)
	 * @return {Object} Returns a TimerObject
	 */
	logger.prototype.timer = function(name) {
		var timer = {
			start: null,
			stop: null,
			name: name,
			logger: this,
			end: function() {
				this.stop = Date.now();
				this.logger.log('Timer ' + this.name + ' runs: ', getHumanTime(this.stop - this.start));
			}
		};

		/*if (name) {
			this.timerStore[name] = timer;
		}*/

		this.log('Start Timer', name);

		//Set timer start time
		timer.start = Date.now();
		return timer;
	};

	logger.prototype.__scope = {
		getHumanTime: getHumanTime
	};
	

	return logger;
})();
/**
 * XQCore.GetSet
 *
 * @module XQCore.GetSet
 * @requires XQCore.Logger
 * @requires XQCore.Event
 */
XQCore.GetSet = (function(window, document, $, undefined) {

	/**
	 * GetSet constructor
	 *
	 * @constructor
	 * @class GetSet
	 * @param {Object} conf COnfig object
	 */
	var getset = function(conf) {
		this.properties = {};
		this._isValid = false;

		if (conf) {
			this.schema = conf.schema;
			this.debug = Boolean(conf.debug);
		}

		this.name = 'GetSet';
		$.extend(this, new XQCore.Logger());
		$.extend(this, new XQCore.Event());
	};

	var undotify = function(path, obj) {
		if(path) {
			path = path.split('.');
			path.forEach(function(key) {
				obj = obj[key];
			});
		}

		return obj;
	};

	// $.extend(getset.prototype, new XQCore.Event());

	/**
	 * Set getset data
	 *
	 * Triggers a data.change event if data was set succesfully
	 *
	 * @method set
	 * @param {Object} data
	 */
	
	/**
	 * Set getset data
	 *
	 * Triggers these events if data was set succesfully<br>
	 * data.change<br>
	 * &lt;key&gt;.change
	 *
	 * @method set
	 * @param {String} key
	 * @param {Object} value Data value
	 */
	getset.prototype.set = function() {
		var newData = {},
			oldData = this.get(),
			validateResult,
			key;

		if (arguments[0] === null) {
			newData = arguments[1];
			this.log('Set data', newData, oldData);
		}
		else if (typeof arguments[0] === 'object') {
			//Add a dataset
			newData = arguments[0];
			this.log('Set data', newData, oldData);
		}
		else if (typeof arguments[0] === 'string') {
			newData = this.get();
			key = arguments[0];
			var val = arguments[1];

			newData[key] = val;
			this.log('Set data', newData, oldData);
		}
		else {
			this.warn('Data are incorrect in getset.set()', arguments);
		}

		if (this.schema) {
			validateResult = this.validate(newData);
			if (validateResult !== null) {
				this.warn('Validate error in getset.set', validateResult);
				this.emit('validation.error', validateResult);
				return false;
			}
		}

		if (this.customValidate) {
			console.log('Use custom validation', this.customValidate);
			validateResult = this.customValidate(newData);
			if (validateResult !== null) {
				this.warn('Validate error in getset.set', validateResult);
				this.emit('validation.error', validateResult);
				return false;
			}
		}

		this.properties = newData;
		this.emit('data.change', newData, oldData);

		if (key) {
			this.emit('change.' + key, newData[key]);
		}

		return true;
	};

	/**
	 * Get one or all properties from a dataset
	 *
	 * @param  {String} key Data key
	 *
	 * @return {Object}     getset dataset
	 */
	getset.prototype.get = function(key) {
		if (key === undefined) {
			return this.properties;
		}
		else {
			return this.properties[key];
		}
	};

	/**
	 * Check wether getset has a dataset
	 *
	 * @param {String} key Dataset key
	 * @return {Boolean} Returns true if getset has a dataset with key
	 */
	getset.prototype.has = function(key) {
		return !!this.properties[key];
	};

	/**
	 * Remove all data from getset
	 */
	getset.prototype.reset = function() {
		this.log('Reset getset');
		this.properties = {};
		this.removeAllListener();
	};

	/**
	 * Append data to a subset
	 *
	 * @param {String} path path to subset
	 * @param {Object} data data to add
	 */
	getset.prototype.append = function(path, data) {
		if (arguments.length === 1) {
			data = path;
			path = null;
		}

		var dataset = this.properties,
			oldDataset = this.get(),
			trigger = true;

		if (path) {
			path.split('.').forEach(function(key) {
				dataset = dataset[key];
			});
		}

		console.log(dataset === this.properties);
		if (dataset instanceof Array) {
			dataset.push(data);
		}
		else {
			if (path === null) {
				this.properties = [data];
				dataset = this.get();
			}
			else {
				this.warn('GetSet.append requires an array. Dataset isn\'t an array', path);
			}
		}

		if (trigger) {
			this.emit('data.change', dataset, oldDataset);
		}

		console.log(dataset, this.properties);
		return data;
	};

	/**
	 * Prepend data to a subset
	 *
	 * @param {String} path path to subset
	 * @param {Object} data data to add
	 */
	getset.prototype.prepend = function(path, data) {
		if (arguments.length === 1) {
			data = path;
			path = null;
		}

		var dataset = this.properties,
			oldDataset = this.get(),
			trigger = true;

		if (path) {
			path.split('.').forEach(function(key) {
				dataset = dataset[key];
			});
		}

		if (dataset instanceof Array) {
			dataset.unshift(data);
		}
		else {
			if (path === null) {
				this.properties = [data];
				dataset = this.get();
			}
			else {
				this.warn('GetSet.append requires an array. Dataset isn\'t an array', path);
			}
		}

		if (trigger) {
			this.emit('data.change', dataset, oldDataset);
		}

		return data;
	};

	/**
	 * Remove a subset
	 *
	 * @param {String} path path to subset
	 * @param {Number} index Index of the subsut to remove
	 *
	 * @return {Object} removed subset
	 */
	getset.prototype.remove = function(path, index) {
		var dataset = this.properties,
			data = null;
		path.split('.').forEach(function(key) {
			dataset = dataset[key];
		});

		if (dataset instanceof Array) {
			data = dataset.splice(index, 1);
			data = data[0] || null;
		}
		else {
			this.warn('getset.remove() doesn\'t work with Objects in getset', this.name);
		}

		return data;
	};

	/**
	 * Search a item in models properties
	 *
	 * @param {String} path to the parent property. We use dot notation to navigate to subproperties. (data.bla.blub)
	 * @param {Object} searchfor Searching for object
	 * @return {Object} Returns the first matched item or null
	 */
	getset.prototype.search = function(path, searchfor) {
		var parent = undotify(path, this.properties);

		if (parent) {
			for (var i = 0; i < parent.length; i++) {
				var prop = parent[i],
					matching;

				for (var p in searchfor) {
					if (searchfor.hasOwnProperty(p)) {
						if (prop[p] && prop[p] === searchfor[p]) {
							matching = true;
						}
						else {
							matching = false;
							break;
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
	 * Sort an array collection by a given attribute
	 *
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
	getset.prototype.sortBy = function(path, sortKeys) {
		if (arguments.length === 1) {
			sortKeys = path;
			path = null;
		}

		var data = undotify(path, this.properties),
			order;

		data.sort(function(a, b) {
			order = -1;
			//jshint forin: false
			for (var key in sortKeys) {
				order = String(undotify(key, a)).localeCompare(String(undotify(key, b)));
				if (order === 0) {
					continue;
				}
				else if(sortKeys[key] === -1) {
					order = order > 0 ? -1 : 1;
				}

				break;
			}

			return order;
		});

		this.set(path, data);
		return data;
	};

	getset.prototype.validate = function(data) {
		var failed = [];

		if (this.schema) {
			Object.keys(this.schema).forEach(function(key) {
				var validationResult = this.validateOne(key, data[key]);

				if (validationResult.isValid === true) {
					data[key] = validationResult.value;
				}
				else {
					failed.push(validationResult.error);
				}
			}.bind(this));
		}

		if (failed.length === 0) {
			this._isValid = true;
			return null;
		}
		else {
			this._isValid = false;
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
	 * @param  {String} key   Property key
	 * @param  {Any} value Property value
	 *
	 * @return {Object}       Returns a ValidatorResultItemObject
	 */
	getset.prototype.validateOne = function(key, value) {
		var failed = null,
			schema = this.schema[key];

		console.log('Schema', schema, schema.match);
		if (value === '' && schema.noEmpty === true) {
			value = undefined;
		}

		if ((value === undefined || value === null) && schema.default) {
			value = schema.default;
		}

		if ((value === undefined || value === null || value === '') && schema.required === true) {
			failed = {
				property: key,
				msg: 'Property is undefined or null, but it\'s required',
				errCode: 10
			};
		}
		else if (schema.type === 'string') {
			if (schema.convert && typeof(value) === 'number') {
				value = String(value);
			}

			if (schema.type !== typeof(value)) {
				failed = {
					property: key,
					msg: 'Property type is a ' + typeof(value) + ', but a string is required',
					errCode: 11
				};
			}
			else if(schema.min && schema.min > value.length) {
				failed = {
					property: key,
					msg: 'String length is too short',
					errCode: 12
				};
			}
			else if(schema.max && schema.max < value.length) {
				failed = {
					property: key,
					msg: 'String length is too long',
					errCode: 13
				};
			}
			else if(schema.match && !schema.match.test(value)) {
				failed = {
					property: key,
					msg: 'String doesn\'t match regexp',
					errCode: 14
				};
			}

		}
		else if(schema.type === 'number') {
			if (schema.convert && typeof(value) === 'string') {
				value = parseInt(value, 10);
			}

			if (schema.type !== typeof(value)) {
				failed = {
					property: key,
					msg: 'Property type is a ' + typeof(value) + ', but a number is required',
					errCode: 21
				};
			}
			else if(schema.min && schema.min > value) {
				failed = {
					property: key,
					msg: 'Number is too low',
					errCode: 22
				};
			}
			else if(schema.max && schema.max < value) {
				failed = {
					property: key,
					msg: 'Number is too high',
					errCode: 23
				};
			}
		}
		else if(schema.type === 'date') {
			if (value) {
				var date = Date.parse(value);
				if (isNaN(date)) {
					failed = {
						property: key,
						msg: 'Property isn\'t a valid date',
						errCode: 31
					};
				}
			}
		}
		else if(schema.type === 'array') {
			if (!Array.isArray(value)) {
				failed = {
					property: key,
					msg: 'Property type is a ' + typeof(value) + ', but an array is required',
					errCode: 41
				};
			}
			else if(schema.min && schema.min > value.length) {
				failed = {
					property: key,
					msg: 'Array length is ' + value.length + ' but must be greater than ' + schema.min,
					errCode: 42
				};
			}
			else if(schema.max && schema.max < value.length) {
				failed = {
					property: key,
					msg: 'Array length is ' + value.length + ' but must be lesser than ' + schema.max,
					errCode: 43
				};
			}
		}
		else if(schema.type === 'object') {
			if (typeof(value) !== 'object') {
				failed = {
					property: key,
					msg: 'Property isn\'t a valid object',
					errCode: 51
				};
			}
		}
		else if(schema.type === 'boolean') {
			if (typeof(value) !== 'object') {
				failed = {
					property: key,
					msg: 'Property isn\'t a valid boolean',
					errCode: 61
				};
			}
		}
		else {

		}

		if (failed === null) {
			failed = {
				isValid: true,
				value: value,
				error: null
			};
		}
		else {
			this.warn('Validation error on property', key, failed, 'Data:', value);
			failed = {
				isValid: false,
				value: value,
				error: failed
			};
		}

		return failed;
	};

	getset.prototype.isValid = function() {
		return this._isValid;
	};


	return getset;
})(window, document, jQuery);

 return XQCore;
}));

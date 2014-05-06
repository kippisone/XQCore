/*global SockJS:false */

/**
 * XQCore.Socket module
 * @module XQCore.Socket
 * @requires XQCore.Logger
 * @requires sockJS-client
 */
(function(XQCore, undefined) {
	'use strict';

	var Socket = function() {
		this.__isReady = false;
		this.__onReadyCallbacks = [];
		this.__eventEmitter = new XQCore.Event();
	};


	XQCore.extend(Socket.prototype, new XQCore.Logger());

	/**
	 * Connect to a socket server
	 *
	 * @method connect
	 * @param  {String}   url      Socket server url
	 * @param  {Object}   options  SockJS options
	 * @param  {Function} callback Callback function. Its called if connection was successful and its called before ready state becomes true
	 */
	Socket.prototype.connect = function(url, options, callback) {
		var self = this;


		this.sockJS = new SockJS(url, null, options);
		console.log('Connect to socket server ', url, 'using options:', options);

		this.sockJS.onopen = function() {
			console.log('Connection was successful!');
			if (typeof callback === 'function') {
				callback();
			}

			self.setReady();
		}.bind(this);

		this.sockJS.onmessage = function(e) {
			var msg;

			try {
				msg = JSON.parse(e.data);
			}
			catch(err) {
				console.error('Could\'t parse socket message!', e.data);
			}

			console.log('Got message', msg.eventName, msg.data);
			self.__eventEmitter.emit(msg.eventName, msg.data);
		}.bind(this);

		this.sockJS.onclose = function() {
			console.log('Connection closed!');
		}.bind(this);
	};

	/**
	 * send a message to a socket server
	 * @param  {String} eventName Event name
	 * @param  {Object} data      Data
	 */
	Socket.prototype.emit = function(eventName, data) {
		this.ready(function() {
			console.log('Send message ', eventName, data);
			this.sockJS.send(JSON.stringify({
				eventName: eventName,
				data: data
			}));
		}.bind(this));
	};

	/**
	 * Register a listener for an incoming socket message
	 * @param  {String}   eventName Event name
	 * @param  {Function} callback  Listener callback
	 */
	Socket.prototype.on = function(eventName, callback) {
		this.__eventEmitter.on(eventName, callback);
	};


	/**
	 * Register a once-listener for an incoming socket message
	 * @param  {String}   eventName Event name
	 * @param  {Function} callback  Listener callback
	 */
	Socket.prototype.once = function(eventName, callback) {
		this.__eventEmitter.once(eventName, callback);
	};

	/**
	 * Unregister a socket listener
	 * @param  {String}   eventName Event name
	 * @param  {Function} callback  Listener callback (Optional)
	 */
	Socket.prototype.off = function(eventName, callback) {
		this.__eventEmitter.off(eventName, callback);
	};

	/**
	 * Call function when socket is ready
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

	Socket.prototype.setReady = function() {
		this.__isReady = true;
		this.__onReadyCallbacks.forEach(function(fn) {
			fn.call(this);
		}.bind(this));

		this.__onReadyCallbacks = [];
	};

	XQCore.Socket = Socket;

})(XQCore);
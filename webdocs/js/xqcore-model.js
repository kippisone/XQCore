XQCore.Model = (function(window, document, $, undefined) {
	var model;

	var undotify = function(path, obj) {
		if(path) {
			path = path.split('.');
			path.forEach(function(key) {
				obj = obj[key];
			});
		}

		return obj;
	};

	model = function(conf) {
		if (conf === undefined) {
			conf = {};
		}

		this.customInit = conf.init;
		this.conf = conf;
		delete conf.init;

		$.extend(this, conf, new XQCore.Logger());
		this.name = (conf.name || 'Nameless') + 'Model';
		this.debug = Boolean(conf.debug);
		this.propertys = {};
		this._isValid = false;

		if (conf.validate) {
			this.validate = function(formData) {
				var result;

				this._isValid = false;
				result = conf.validate.call(this, formData);
				if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
					this._isValid = true;
				}

				return result;
			}.bind(this);
		}

		this.init();

		//Add default values
		if (this.defaults) {
			this.set(this.defaults);
		}
	};

	$.extend(model.prototype, XQCore.GetSet.prototype);

	model.prototype.init = function() {
		// custom init
		if (typeof this.customInit === 'function') {
			this.customInit.call(this);
		}
	};

	model.prototype.validate = function() {

	};

	model.prototype.isValid = function() {
		return this._isValid;
	};

	/**
	 * Called on before sending an ajax request
	 * You can use this function to manipulate all data they be send to the server
	 *
	 * @param {Object} data The data to send to the server
	 * @return {Object} data
	 */
	model.prototype.onSend = function(data) {
		return data;
	};

	/**
	 * Send an ajax request to the webserver.
	 *
	 * You must set the server URI first with model.server = 'http://example.com/post'
	 *
	 * @param {String} Method send method, GET, POST, PUT, DELETE (default POST)
	 * @param {Object} data The data to sent to the server
	 * @param {Function} callback Calls callback(err, data, status, jqXHR) if response was receiving
	 */
	model.prototype.send = function(method, data, callback) {

		if (!this.server) {
			this.error('Can not send an ajax request! You must define a server URL first.');
			return false;
		}

		if (data === undefined) {
			data = this.get();
		}

		if (method === undefined) {
			method = 'POST';
		}

		//Handle onSend
		if (typeof this.onSend === 'function') {
			data = this.onSend.call(this, data);
		}

		this.log('Sending an ajax call to ', this.server, 'with data: ', data);

		$.ajax({
			url: this.server,
			type: method,
			data: data,
			success: function(data, status, jqXHR) {
				if (typeof callback === 'function') {
					callback.call(this, null, data, status, jqXHR);
				}
			}.bind(this),
			error: function(jqXHR, status, error) {
				if (typeof callback === 'function') {
					callback.call(this, {
						type: status,
						http: error
					}, null, status, jqXHR);
				}
			}.bind(this)
		});
	};

	/**
	 * Sends a POST to the Datastore
	 *
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	model.prototype.sendPOST = function(data, callback) {
		this.send('POST', data, callback);
	};

	/**
	 * Sends a GET to the Datastore
	 *
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	model.prototype.sendGET = function(data, callback) {
		this.send('GET', data, callback);
	};

	/**
	 * Sends a UPDATE to the Datastore
	 *
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	model.prototype.sendUPDATE = function(data, callback) {
		this.send('UPDATE', data, callback);
	};

	/**
	 * Sends a DELETE to the Datastore
	 *
	 * @param  {Object}   data     Dato to sending
	 * @param  {Function} callback Calling on response
	 *
	 * callback: void function(err, data, status, jqXHR)
	 *
	 */
	model.prototype.sendDELETE = function(data, callback) {
		this.send('DELETE', data, callback);
	};

	return model;
})(window, document, jQuery);

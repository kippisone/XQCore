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
 * 
 */
(function(XQCore, undefined) {
    'use strict';
    var SyncList;

    SyncList = function(name, conf) {
        //Call XQCore.List constructor
        XQCore.List.call(this, name, conf);

        this.server = this.server || location.protocol + '//' + location.hostname;
        this.port = this.port || 9999;
        this.path = this.path || 'xqsocket/' + this.name.toLowerCase();
        this.syncEnabled = false;
        this.connectToSocket();
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
     * Register a sync list at the socket server
     * @param  {Boolean} enableSync Enables/Disables the initial sync. Defaults to false
     */
    SyncList.prototype.register = function(enableSync) {
        if (typeof enableSync === 'boolean') {
            this.syncEnabled = enableSync;
        }

        this.dev('Register synclist at server:', this.name);
        this.socket.emit('synclist.register', {
            name: this.name
        });

        var opts = {
            noSync: true
        };
        
        this.socket.on('synclist.push', function(data) {
            this.push(data, opts);
        });
        
        this.socket.on('synclist.unshift', function(data) {
            this.push(data, opts);
        });
        
        this.socket.on('synclist.pop', function() {
            this.push(opts);
        });
        
        this.socket.on('synclist.shift', function() {
            this.push(opts);
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

    XQCore.SyncList = SyncList;
})(XQCore);
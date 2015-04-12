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

        log.info('popstate event recived', data, self);

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

            log.info('Trigger route', route, data);

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
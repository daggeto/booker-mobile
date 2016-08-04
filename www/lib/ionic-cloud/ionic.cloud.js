(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var App = (function () {
    function App(id) {
        this.id = id;
        this.id = id;
    }
    App.prototype.toString = function () {
        return "<App [" + this.id + "]>";
    };
    return App;
}());
exports.App = App;

},{}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var errors_1 = require('./errors');
var promise_1 = require('./promise');
var AuthTokenContext = (function () {
    function AuthTokenContext(deps, label) {
        this.label = label;
        this.storage = deps.storage;
    }
    AuthTokenContext.prototype.get = function () {
        return this.storage.get(this.label);
    };
    AuthTokenContext.prototype.store = function (token) {
        this.storage.set(this.label, token);
    };
    AuthTokenContext.prototype.delete = function () {
        this.storage.remove(this.label);
    };
    return AuthTokenContext;
}());
exports.AuthTokenContext = AuthTokenContext;
var CombinedAuthTokenContext = (function () {
    function CombinedAuthTokenContext(deps, label) {
        this.label = label;
        this.storage = deps.storage;
        this.tempStorage = deps.tempStorage;
    }
    CombinedAuthTokenContext.prototype.get = function () {
        var permToken = this.storage.get(this.label);
        var tempToken = this.tempStorage.get(this.label);
        var token = tempToken || permToken;
        return token;
    };
    CombinedAuthTokenContext.prototype.store = function (token, options) {
        if (options === void 0) { options = { 'permanent': true }; }
        if (options.permanent) {
            this.storage.set(this.label, token);
        }
        else {
            this.tempStorage.set(this.label, token);
        }
    };
    CombinedAuthTokenContext.prototype.delete = function () {
        this.storage.remove(this.label);
        this.tempStorage.remove(this.label);
    };
    return CombinedAuthTokenContext;
}());
exports.CombinedAuthTokenContext = CombinedAuthTokenContext;
function getAuthErrorDetails(err) {
    var details = [];
    try {
        details = err.response.body.error.details;
    }
    catch (e) {
        e;
    }
    return details;
}
var Auth = (function () {
    function Auth(deps, options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.emitter = deps.emitter;
        this.authModules = deps.authModules;
        this.tokenContext = deps.tokenContext;
        this.userService = deps.userService;
    }
    Auth.prototype.isAuthenticated = function () {
        var token = this.tokenContext.get();
        if (token) {
            return true;
        }
        return false;
    };
    Auth.prototype.login = function (moduleId, data, options) {
        var _this = this;
        if (options === void 0) { options = { 'remember': true }; }
        var context = this.authModules[moduleId];
        if (!context) {
            throw new Error('Authentication class is invalid or missing:' + context);
        }
        return context.authenticate(data).then(function (token) {
            _this.storeToken(options, token);
            return _this.userService.load().then(function () {
                var user = _this.userService.current();
                user.store();
                return user;
            });
        });
    };
    Auth.prototype.signup = function (data) {
        var context = this.authModules.basic;
        if (!context) {
            throw new Error('Authentication class is invalid or missing:' + context);
        }
        return context.signup.apply(context, [data]);
    };
    Auth.prototype.logout = function () {
        this.tokenContext.delete();
        var user = this.userService.current();
        user.unstore();
        user.clear();
    };
    Auth.prototype.getToken = function () {
        return this.tokenContext.get();
    };
    Auth.prototype.storeToken = function (options, token) {
        if (options === void 0) { options = { 'remember': true }; }
        var originalToken = this.authToken;
        this.authToken = token;
        this.tokenContext.store(this.authToken, { 'permanent': options.remember });
        this.emitter.emit('auth:token-changed', { 'old': originalToken, 'new': this.authToken });
    };
    return Auth;
}());
exports.Auth = Auth;
var AuthType = (function () {
    function AuthType(deps) {
        this.config = deps.config;
        this.client = deps.client;
    }
    AuthType.prototype.inAppBrowserFlow = function (options, data) {
        if (data === void 0) { data = {}; }
        var deferred = new promise_1.DeferredPromise();
        if (!window || !window.cordova || !window.cordova.InAppBrowser) {
            deferred.reject(new Error('InAppBrowser plugin missing'));
        }
        else {
            var method = options.uri_method ? options.uri_method : 'POST';
            var provider = options.provider ? '/' + options.provider : '';
            this.client.request(method, "/auth/login" + provider)
                .send({
                'app_id': this.config.get('app_id'),
                'callback': options.callback_uri || window.location.href,
                'data': data
            })
                .end(function (err, res) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    var loc = res.body.data.url;
                    var tempBrowser = window.cordova.InAppBrowser.open(loc, '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
                    tempBrowser.addEventListener('loadstart', function (data) {
                        if (data.url.slice(0, 20) === 'http://auth.ionic.io') {
                            var queryString = data.url.split('#')[0].split('?')[1];
                            var paramParts = queryString.split('&');
                            var params = {};
                            for (var i = 0; i < paramParts.length; i++) {
                                var part = paramParts[i].split('=');
                                params[part[0]] = part[1];
                            }
                            tempBrowser.close();
                            tempBrowser = null;
                            deferred.resolve(params.token);
                        }
                    });
                }
            });
        }
        return deferred.promise;
    };
    return AuthType;
}());
exports.AuthType = AuthType;
var BasicAuth = (function (_super) {
    __extends(BasicAuth, _super);
    function BasicAuth() {
        _super.apply(this, arguments);
    }
    BasicAuth.prototype.authenticate = function (data) {
        var deferred = new promise_1.DeferredPromise();
        if (!data.email || !data.password) {
            deferred.reject(new Error('email and password are required for basic authentication'));
        }
        else {
            this.client.post('/auth/login')
                .send({
                'app_id': this.config.get('app_id'),
                'email': data.email,
                'password': data.password
            })
                .end(function (err, res) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve(res.body.data.token);
                }
            });
        }
        return deferred.promise;
    };
    BasicAuth.prototype.signup = function (data) {
        var deferred = new promise_1.DeferredPromise();
        var userData = {
            'app_id': this.config.get('app_id'),
            'email': data.email,
            'password': data.password
        };
        // optional details
        if (data.username) {
            userData.username = data.username;
        }
        if (data.image) {
            userData.image = data.image;
        }
        if (data.name) {
            userData.name = data.name;
        }
        if (data.custom) {
            userData.custom = data.custom;
        }
        this.client.post('/users')
            .send(userData)
            .end(function (err, res) {
            if (err) {
                var errors = [];
                var details = getAuthErrorDetails(err);
                if (details instanceof Array) {
                    for (var i = 0; i < details.length; i++) {
                        var detail = details[i];
                        if (typeof detail === 'object') {
                            if (detail.error_type) {
                                errors.push(detail.error_type + '_' + detail.parameter);
                            }
                        }
                    }
                }
                deferred.reject(new errors_1.DetailedError('Error creating user', errors));
            }
            else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };
    return BasicAuth;
}(AuthType));
exports.BasicAuth = BasicAuth;
var CustomAuth = (function (_super) {
    __extends(CustomAuth, _super);
    function CustomAuth() {
        _super.apply(this, arguments);
    }
    CustomAuth.prototype.authenticate = function (data) {
        if (data === void 0) { data = {}; }
        return this.inAppBrowserFlow({ 'provider': 'custom' }, data);
    };
    return CustomAuth;
}(AuthType));
exports.CustomAuth = CustomAuth;
var TwitterAuth = (function (_super) {
    __extends(TwitterAuth, _super);
    function TwitterAuth() {
        _super.apply(this, arguments);
    }
    TwitterAuth.prototype.authenticate = function (data) {
        if (data === void 0) { data = {}; }
        return this.inAppBrowserFlow({ 'provider': 'twitter' }, data);
    };
    return TwitterAuth;
}(AuthType));
exports.TwitterAuth = TwitterAuth;
var FacebookAuth = (function (_super) {
    __extends(FacebookAuth, _super);
    function FacebookAuth() {
        _super.apply(this, arguments);
    }
    FacebookAuth.prototype.authenticate = function (data) {
        if (data === void 0) { data = {}; }
        return this.inAppBrowserFlow({ 'provider': 'facebook' }, data);
    };
    return FacebookAuth;
}(AuthType));
exports.FacebookAuth = FacebookAuth;
var GithubAuth = (function (_super) {
    __extends(GithubAuth, _super);
    function GithubAuth() {
        _super.apply(this, arguments);
    }
    GithubAuth.prototype.authenticate = function (data) {
        if (data === void 0) { data = {}; }
        return this.inAppBrowserFlow({ 'provider': 'github' }, data);
    };
    return GithubAuth;
}(AuthType));
exports.GithubAuth = GithubAuth;
var GoogleAuth = (function (_super) {
    __extends(GoogleAuth, _super);
    function GoogleAuth() {
        _super.apply(this, arguments);
    }
    GoogleAuth.prototype.authenticate = function (data) {
        if (data === void 0) { data = {}; }
        return this.inAppBrowserFlow({ 'provider': 'google' }, data);
    };
    return GoogleAuth;
}(AuthType));
exports.GoogleAuth = GoogleAuth;
var InstagramAuth = (function (_super) {
    __extends(InstagramAuth, _super);
    function InstagramAuth() {
        _super.apply(this, arguments);
    }
    InstagramAuth.prototype.authenticate = function (data) {
        if (data === void 0) { data = {}; }
        return this.inAppBrowserFlow({ 'provider': 'instagram' }, data);
    };
    return InstagramAuth;
}(AuthType));
exports.InstagramAuth = InstagramAuth;
var LinkedInAuth = (function (_super) {
    __extends(LinkedInAuth, _super);
    function LinkedInAuth() {
        _super.apply(this, arguments);
    }
    LinkedInAuth.prototype.authenticate = function (data) {
        if (data === void 0) { data = {}; }
        return this.inAppBrowserFlow({ 'provider': 'linkedin' }, data);
    };
    return LinkedInAuth;
}(AuthType));
exports.LinkedInAuth = LinkedInAuth;

},{"./errors":10,"./promise":15}],3:[function(require,module,exports){
"use strict";
var request = require('superagent');
var Client = (function () {
    function Client(tokenContext, baseUrl, req // TODO: use superagent types
        ) {
        this.tokenContext = tokenContext;
        this.baseUrl = baseUrl;
        if (typeof req === 'undefined') {
            req = request;
        }
        this.req = req;
    }
    Client.prototype.get = function (endpoint) {
        return this.supplement(this.req.get, endpoint);
    };
    Client.prototype.post = function (endpoint) {
        return this.supplement(this.req.post, endpoint);
    };
    Client.prototype.put = function (endpoint) {
        return this.supplement(this.req.put, endpoint);
    };
    Client.prototype.patch = function (endpoint) {
        return this.supplement(this.req.patch, endpoint);
    };
    Client.prototype.delete = function (endpoint) {
        return this.supplement(this.req.delete, endpoint);
    };
    Client.prototype.request = function (method, endpoint) {
        return this.supplement(this.req.bind(this.req, method), endpoint);
    };
    Client.prototype.supplement = function (fn, endpoint) {
        if (endpoint.substring(0, 1) !== '/') {
            throw Error('endpoint must start with leading slash');
        }
        var req = fn(this.baseUrl + endpoint);
        var token = this.tokenContext.get();
        if (token) {
            req.set('Authorization', "Bearer " + token);
        }
        return req;
    };
    return Client;
}());
exports.Client = Client;

},{"superagent":24}],4:[function(require,module,exports){
"use strict";
var Config = (function () {
    function Config() {
        this.urls = {
            'api': 'https://api.ionic.io'
        };
    }
    Config.prototype.register = function (settings) {
        this.settings = settings;
    };
    Config.prototype.get = function (name) {
        if (!this.settings) {
            return undefined;
        }
        return this.settings[name];
    };
    Config.prototype.getURL = function (name) {
        var urls = this.settings && this.settings['urls'] || {};
        if (urls[name]) {
            return urls[name];
        }
        return this.urls[name];
    };
    return Config;
}());
exports.Config = Config;

},{}],5:[function(require,module,exports){
"use strict";
var Cordova = (function () {
    function Cordova(deps, options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.device = deps.device;
        this.emitter = deps.emitter;
        this.logger = deps.logger;
    }
    Cordova.prototype.bootstrap = function () {
        var _this = this;
        var events = ['pause', 'resume'];
        document.addEventListener('deviceready', function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            _this.emitter.emit('cordova:deviceready', { 'args': args });
            var _loop_1 = function(e) {
                document.addEventListener(e, function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    _this.emitter.emit('cordova:' + e, { 'args': args });
                }, false);
            };
            for (var _a = 0, events_1 = events; _a < events_1.length; _a++) {
                var e = events_1[_a];
                _loop_1(e);
            }
        }, false);
        this.load();
    };
    Cordova.prototype.load = function () {
        if (!this.isAvailable()) {
            var cordovaScript = document.createElement('script');
            var cordovaSrc = 'cordova.js';
            switch (this.device.deviceType) {
                case 'android':
                    if (window.location.href.substring(0, 4) === 'file') {
                        cordovaSrc = 'file:///android_asset/www/cordova.js';
                    }
                    break;
                case 'ipad':
                case 'iphone':
                    try {
                        var resource = window.location.search.match(/cordova_js_bootstrap_resource=(.*?)(&|#|$)/i);
                        if (resource) {
                            cordovaSrc = decodeURI(resource[1]);
                        }
                    }
                    catch (e) {
                        if (this.logger) {
                            this.logger.info('Ionic Cordova: could not find cordova_js_bootstrap_resource query param');
                            this.logger.info('Ionic Cordova:', e);
                        }
                    }
                    break;
                default:
                    break;
            }
            cordovaScript.setAttribute('src', cordovaSrc);
            document.head.appendChild(cordovaScript);
            if (this.logger) {
                this.logger.info('Ionic Cordova: injecting cordova.js');
            }
        }
    };
    Cordova.prototype.isAvailable = function () {
        if (this.logger) {
            this.logger.info('Ionic Cordova: searching for cordova.js');
        }
        if (typeof cordova !== 'undefined') {
            if (this.logger) {
                this.logger.info('Ionic Cordova: cordova.js has already been loaded');
            }
            return true;
        }
        var scripts = document.getElementsByTagName('script');
        var len = scripts.length;
        for (var i = 0; i < len; i++) {
            var script = scripts[i].getAttribute('src');
            if (script) {
                var parts = script.split('/');
                var partsLength = 0;
                try {
                    partsLength = parts.length;
                    if (parts[partsLength - 1] === 'cordova.js') {
                        if (this.logger) {
                            this.logger.info('Ionic Cordova: cordova.js has previously been included.');
                        }
                        return true;
                    }
                }
                catch (e) {
                    if (this.logger) {
                        this.logger.info('Ionic Cordova: encountered error while testing for cordova.js presence, ' + e.toString());
                    }
                }
            }
        }
        return false;
    };
    return Cordova;
}());
exports.Cordova = Cordova;

},{}],6:[function(require,module,exports){
"use strict";
var Core = (function () {
    function Core(deps, cfg) {
        this.cfg = cfg;
        this._version = '0.8.0-beta.12';
        this.config = deps.config;
        this.logger = deps.logger;
        this.emitter = deps.emitter;
        this.insights = deps.insights;
        this.registerEventHandlers();
        this.insights.track('mobileapp.opened');
    }
    Object.defineProperty(Core.prototype, "version", {
        get: function () {
            return this._version;
        },
        enumerable: true,
        configurable: true
    });
    Core.prototype.registerEventHandlers = function () {
        var _this = this;
        this.emitter.on('cordova:resume', function (data) {
            _this.insights.track('mobileapp.opened');
        });
        this.emitter.on('push:notification', function (data) {
            if (data.message.app.asleep || data.message.app.closed) {
                _this.insights.track('mobileapp.opened.push');
            }
        });
    };
    return Core;
}());
exports.Core = Core;

},{}],7:[function(require,module,exports){
"use strict";
var promise_1 = require('../promise');
var NO_PLUGIN = new Error('Missing deploy plugin: `ionic-plugin-deploy`');
var INITIAL_DELAY = 1 * 5 * 1000;
var WATCH_INTERVAL = 1 * 60 * 1000;
var Deploy = (function () {
    function Deploy(deps, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this._channelTag = 'production';
        this.config = deps.config;
        this.emitter = deps.emitter;
        this.logger = deps.logger;
        this.emitter.once('device:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.init(_this.config.get('app_id'), _this.config.getURL('api'));
            }
            _this.emitter.emit('deploy:ready');
        });
    }
    /**
     * Fetch the Deploy Plugin
     *
     * If the plugin has not been set yet, attempt to fetch it, otherwise log
     * a message.
     *
     * @return {IonicDeploy} Returns the plugin or false
     */
    Deploy.prototype._getPlugin = function () {
        if (typeof window.IonicDeploy === 'undefined') {
            this.logger.warn('Ionic Deploy: Disabled! Deploy plugin is not installed or has not loaded. Have you run `ionic plugin add ionic-plugin-deploy` yet?');
            return;
        }
        if (!this._plugin) {
            this._plugin = window.IonicDeploy;
        }
        return this._plugin;
    };
    /**
     * Check for updates
     *
     * @return {Promise} Will resolve with true if an update is available, false otherwise. A string or
     *   error will be passed to reject() in the event of a failure.
     */
    Deploy.prototype.check = function () {
        var _this = this;
        var deferred = new promise_1.DeferredPromise();
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.check(_this.config.get('app_id'), _this._channelTag, function (result) {
                    if (result && result === 'true') {
                        _this.logger.info('Ionic Deploy: an update is available');
                        deferred.resolve(true);
                    }
                    else {
                        _this.logger.info('Ionic Deploy: no updates available');
                        deferred.resolve(false);
                    }
                }, function (error) {
                    _this.logger.error('Ionic Deploy: encountered an error while checking for updates');
                    deferred.reject(error);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    /**
     * Download and available update
     *
     * This should be used in conjunction with extract()
     * @return {Promise} The promise which will resolve with true/false.
     */
    Deploy.prototype.download = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var deferred = new promise_1.DeferredPromise();
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.download(_this.config.get('app_id'), function (result) {
                    if (result !== 'true' && result !== 'false') {
                        if (options.onProgress) {
                            options.onProgress(result);
                        }
                    }
                    else {
                        if (result === 'true') {
                            _this.logger.info('Ionic Deploy: download complete');
                        }
                        deferred.resolve(result === 'true');
                    }
                }, function (error) {
                    deferred.reject(error);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    /**
     * Extract the last downloaded update
     *
     * This should be called after a download() successfully resolves.
     * @return {Promise} The promise which will resolve with true/false.
     */
    Deploy.prototype.extract = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var deferred = new promise_1.DeferredPromise();
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.extract(_this.config.get('app_id'), function (result) {
                    if (result !== 'done') {
                        if (options.onProgress) {
                            options.onProgress(result);
                        }
                    }
                    else {
                        if (result === 'true') {
                            _this.logger.info('Ionic Deploy: extraction complete');
                        }
                        deferred.resolve(result === 'true');
                    }
                }, function (error) {
                    deferred.reject(error);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    /**
     * Load the latest deployed version
     * This is only necessary to call if you have manually downloaded and extracted
     * an update and wish to reload the app with the latest deploy. The latest deploy
     * will automatically be loaded when the app is started.
     *
     * @return {void}
     */
    Deploy.prototype.load = function () {
        var _this = this;
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.redirect(_this.config.get('app_id'));
            }
        });
    };
    /**
     * Watch constantly checks for updates, and triggers an event when one is ready.
     */
    Deploy.prototype.watch = function (options) {
        if (options === void 0) { options = {}; }
        var self = this;
        if (!options.initialDelay) {
            options.initialDelay = INITIAL_DELAY;
        }
        if (!options.interval) {
            options.interval = WATCH_INTERVAL;
        }
        function checkForUpdates() {
            self.check().then(function (hasUpdate) {
                if (hasUpdate) {
                    self.emitter.emit('deploy:update-ready');
                }
            }, function (err) {
                self.logger.info('Ionic Deploy: unable to check for updates: ' + err);
            });
            // Check our timeout to make sure it wasn't cleared while we were waiting
            // for a server response
            if (this._checkTimeout) {
                this._checkTimeout = setTimeout(checkForUpdates.bind(self), options.interval);
            }
        }
        // Check after an initial short deplay
        this._checkTimeout = setTimeout(checkForUpdates.bind(self), options.initialDelay);
    };
    /**
     * Stop automatically looking for updates
     */
    Deploy.prototype.unwatch = function () {
        clearTimeout(this._checkTimeout);
        this._checkTimeout = null;
    };
    /**
     * Information about the current deploy
     *
     * @return {Promise} The resolver will be passed an object that has key/value
     *    pairs pertaining to the currently deployed update.
     */
    Deploy.prototype.info = function () {
        var _this = this;
        var deferred = new promise_1.DeferredPromise(); // TODO
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.info(_this.config.get('app_id'), function (result) {
                    deferred.resolve(result);
                }, function (err) {
                    deferred.reject(err);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    /**
     * List the Deploy versions that have been installed on this device
     *
     * @return {Promise} The resolver will be passed an array of deploy uuids
     */
    Deploy.prototype.getVersions = function () {
        var _this = this;
        var deferred = new promise_1.DeferredPromise(); // TODO
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.getVersions(_this.config.get('app_id'), function (result) {
                    deferred.resolve(result);
                }, function (err) {
                    deferred.reject(err);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    /**
     * Remove an installed deploy on this device
     *
     * @param {string} uuid The deploy uuid you wish to remove from the device
     * @return {Promise} Standard resolve/reject resolution
     */
    Deploy.prototype.deleteVersion = function (uuid) {
        var _this = this;
        var deferred = new promise_1.DeferredPromise(); // TODO
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.deleteVersion(_this.config.get('app_id'), uuid, function (result) {
                    deferred.resolve(result);
                }, function (err) {
                    deferred.reject(err);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    /**
     * Fetches the metadata for a given deploy uuid. If no uuid is given, it will attempt
     * to grab the metadata for the most recently known update version.
     *
     * @param {string} uuid The deploy uuid you wish to grab metadata for, can be left blank to grab latest known update metadata
     * @return {Promise} Standard resolve/reject resolution
     */
    Deploy.prototype.getMetadata = function (uuid) {
        var _this = this;
        var deferred = new promise_1.DeferredPromise(); // TODO
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                _this._plugin.getMetadata(_this.config.get('app_id'), uuid, function (result) {
                    deferred.resolve(result.metadata);
                }, function (err) {
                    deferred.reject(err);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    /**
     * Set the deploy channel that should be checked for updatse
     * See http://docs.ionic.io/docs/deploy-channels for more information
     *
     * @param {string} channelTag The channel tag to use
     */
    Deploy.prototype.setChannel = function (channelTag) {
        this._channelTag = channelTag;
    };
    /**
     * Update app with the latest deploy
     */
    Deploy.prototype.update = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var deferred = new promise_1.DeferredPromise();
        this.emitter.once('deploy:ready', function () {
            if (_this._getPlugin()) {
                // Check for updates
                _this.check().then(function (result) {
                    if (result === true) {
                        // There are updates, download them
                        var downloadProgress_1 = 0;
                        _this.download({
                            'onProgress': function (p) {
                                downloadProgress_1 = p / 2;
                                if (options.onProgress) {
                                    options.onProgress(downloadProgress_1);
                                }
                            }
                        }).then(function (result) {
                            if (!result) {
                                deferred.reject(new Error('Error while downloading'));
                            }
                            _this.extract({
                                'onProgress': function (p) {
                                    if (options.onProgress) {
                                        options.onProgress(downloadProgress_1 + p / 2);
                                    }
                                }
                            }).then(function (result) {
                                if (!result) {
                                    deferred.reject(new Error('Error while extracting'));
                                }
                                if (!options.deferLoad) {
                                    deferred.resolve(true);
                                    _this._plugin.redirect(_this.config.get('app_id'));
                                }
                                else {
                                    deferred.resolve(true);
                                }
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }
                    else {
                        deferred.resolve(false);
                    }
                }, function (error) {
                    deferred.reject(error);
                });
            }
            else {
                deferred.reject(NO_PLUGIN);
            }
        });
        return deferred.promise;
    };
    return Deploy;
}());
exports.Deploy = Deploy;

},{"../promise":15}],8:[function(require,module,exports){
"use strict";
var Device = (function () {
    function Device(deps) {
        this.deps = deps;
        this.emitter = this.deps.emitter;
        this.deviceType = this.determineDeviceType();
        this.registerEventHandlers();
    }
    Device.prototype.registerEventHandlers = function () {
        var _this = this;
        if (this.deviceType === 'unknown') {
            this.emitter.emit('device:ready');
        }
        else {
            this.emitter.once('cordova:deviceready', function () {
                _this.emitter.emit('device:ready');
            });
        }
    };
    /**
     * Check if the device is an Android device
     * @return {boolean} True if Android, false otherwise
     */
    Device.prototype.isAndroid = function () {
        return this.deviceType === 'android';
    };
    /**
     * Check if the device is an iOS device
     * @return {boolean} True if iOS, false otherwise
     */
    Device.prototype.isIOS = function () {
        return this.deviceType === 'iphone' || this.deviceType === 'ipad';
    };
    Device.prototype.isConnectedToNetwork = function (options) {
        if (options === void 0) { options = {}; }
        if (typeof navigator.connection === 'undefined' ||
            typeof navigator.connection.type === 'undefined' ||
            typeof Connection === 'undefined') {
            if (!options.strictMode) {
                return true;
            }
            return false;
        }
        switch (navigator.connection.type) {
            case Connection.ETHERNET:
            case Connection.WIFI:
            case Connection.CELL_2G:
            case Connection.CELL_3G:
            case Connection.CELL_4G:
            case Connection.CELL:
                return true;
            default:
                return false;
        }
    };
    /**
     * Determine the device type via the user agent string
     * @return {string} name of device platform or 'unknown' if unable to identify the device
     */
    Device.prototype.determineDeviceType = function () {
        var agent = navigator.userAgent;
        var ipad = agent.match(/iPad/i);
        if (ipad && (ipad[0].toLowerCase() === 'ipad')) {
            return 'ipad';
        }
        var iphone = agent.match(/iPhone/i);
        if (iphone && (iphone[0].toLowerCase() === 'iphone')) {
            return 'iphone';
        }
        var android = agent.match(/Android/i);
        if (android && (android[0].toLowerCase() === 'android')) {
            return 'android';
        }
        return 'unknown';
    };
    return Device;
}());
exports.Device = Device;

},{}],9:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var auth_1 = require('./auth');
var app_1 = require('./app');
var client_1 = require('./client');
var config_1 = require('./config');
var cordova_1 = require('./cordova');
var core_1 = require('./core');
var deploy_1 = require('./deploy/deploy');
var device_1 = require('./device');
var events_1 = require('./events');
var insights_1 = require('./insights');
var logger_1 = require('./logger');
var push_1 = require('./push/push');
var storage_1 = require('./storage');
var user_1 = require('./user/user');
var modules = {};
function cache(target, propertyKey, descriptor) {
    var method = descriptor.get;
    descriptor.get = function () {
        if (typeof modules[propertyKey] === 'undefined') {
            var value = method.apply(this, arguments);
            modules[propertyKey] = value;
        }
        return modules[propertyKey];
    };
    descriptor.set = function (value) { };
}
var Container = (function () {
    function Container() {
    }
    Object.defineProperty(Container.prototype, "config", {
        get: function () {
            return new config_1.Config();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "eventEmitter", {
        get: function () {
            return new events_1.EventEmitter();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "logger", {
        get: function () {
            return new logger_1.Logger();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "app", {
        get: function () {
            var config = this.config;
            var app = new app_1.App(config.get('app_id'));
            app.gcmKey = config.get('gcm_key');
            return app;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "localStorageStrategy", {
        get: function () {
            return new storage_1.LocalStorageStrategy();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "sessionStorageStrategy", {
        get: function () {
            return new storage_1.SessionStorageStrategy();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "authTokenContext", {
        get: function () {
            var label = 'ionic_io_auth_' + this.config.get('app_id');
            return new auth_1.CombinedAuthTokenContext({ 'storage': this.localStorageStrategy, 'tempStorage': this.sessionStorageStrategy }, label);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "client", {
        get: function () {
            return new client_1.Client(this.authTokenContext, this.config.getURL('api'));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "insights", {
        get: function () {
            return new insights_1.Insights({ 'app': this.app, 'client': this.client, 'logger': this.logger }, { 'intervalSubmit': 60 * 1000 });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "core", {
        get: function () {
            return new core_1.Core({ 'config': this.config, 'logger': this.logger, 'emitter': this.eventEmitter, 'insights': this.insights });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "device", {
        get: function () {
            return new device_1.Device({ 'emitter': this.eventEmitter });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "cordova", {
        get: function () {
            return new cordova_1.Cordova({ 'device': this.device, 'emitter': this.eventEmitter, 'logger': this.logger });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "storage", {
        get: function () {
            return new storage_1.Storage({ 'strategy': this.localStorageStrategy });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "userContext", {
        get: function () {
            return new user_1.UserContext({ 'storage': this.storage, 'config': this.config });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "singleUserService", {
        get: function () {
            return new user_1.SingleUserService({ 'client': this.client, 'context': this.userContext });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "authModules", {
        get: function () {
            return {
                'basic': new auth_1.BasicAuth({ 'config': this.config, 'client': this.client }),
                'custom': new auth_1.CustomAuth({ 'config': this.config, 'client': this.client }),
                'twitter': new auth_1.TwitterAuth({ 'config': this.config, 'client': this.client }),
                'facebook': new auth_1.FacebookAuth({ 'config': this.config, 'client': this.client }),
                'github': new auth_1.GithubAuth({ 'config': this.config, 'client': this.client }),
                'google': new auth_1.GoogleAuth({ 'config': this.config, 'client': this.client }),
                'instagram': new auth_1.InstagramAuth({ 'config': this.config, 'client': this.client }),
                'linkedin': new auth_1.LinkedInAuth({ 'config': this.config, 'client': this.client })
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "auth", {
        get: function () {
            return new auth_1.Auth({
                'emitter': this.eventEmitter,
                'authModules': this.authModules,
                'tokenContext': this.authTokenContext,
                'userService': this.singleUserService
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "push", {
        get: function () {
            return new push_1.Push({
                'config': this.config,
                'app': this.app,
                'auth': this.auth,
                'userService': this.singleUserService,
                'device': this.device,
                'client': this.client,
                'emitter': this.eventEmitter,
                'storage': this.storage,
                'logger': this.logger
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "deploy", {
        get: function () {
            return new deploy_1.Deploy({
                'config': this.config,
                'emitter': this.eventEmitter,
                'logger': this.logger
            });
        },
        enumerable: true,
        configurable: true
    });
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "config", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "eventEmitter", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "logger", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "app", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "localStorageStrategy", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "sessionStorageStrategy", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "authTokenContext", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "client", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "insights", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "core", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "device", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "cordova", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "storage", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "userContext", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "singleUserService", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "authModules", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "auth", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "push", null);
    __decorate([
        cache, 
        __metadata('design:type', Object)
    ], Container.prototype, "deploy", null);
    return Container;
}());
exports.Container = Container;

},{"./app":1,"./auth":2,"./client":3,"./config":4,"./cordova":5,"./core":6,"./deploy/deploy":7,"./device":8,"./events":11,"./insights":13,"./logger":14,"./push/push":17,"./storage":19,"./user/user":21}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Exception = (function (_super) {
    __extends(Exception, _super);
    function Exception(message) {
        _super.call(this, message);
        this.message = message;
        this.name = 'Exception';
        this.stack = (new Error()).stack;
    }
    Exception.prototype.toString = function () {
        return this.name + ": " + this.message;
    };
    return Exception;
}(Error));
exports.Exception = Exception;
var DetailedError = (function (_super) {
    __extends(DetailedError, _super);
    function DetailedError(message, details) {
        _super.call(this, message);
        this.message = message;
        this.details = details;
        this.name = 'DetailedError';
    }
    return DetailedError;
}(Exception));
exports.DetailedError = DetailedError;

},{}],11:[function(require,module,exports){
"use strict";
var EventEmitter = (function () {
    function EventEmitter() {
        this.eventHandlers = {};
        this.eventsEmitted = {};
    }
    EventEmitter.prototype.on = function (event, callback) {
        if (typeof this.eventHandlers[event] === 'undefined') {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
    };
    EventEmitter.prototype.once = function (event, callback) {
        var _this = this;
        if (this.emitted(event)) {
            callback();
        }
        else {
            this.on(event, function () {
                if (!_this.emitted(event)) {
                    callback();
                }
            });
        }
    };
    EventEmitter.prototype.emit = function (event, data) {
        if (data === void 0) { data = null; }
        if (typeof this.eventHandlers[event] === 'undefined') {
            this.eventHandlers[event] = [];
        }
        if (typeof this.eventsEmitted[event] === 'undefined') {
            this.eventsEmitted[event] = 0;
        }
        for (var _i = 0, _a = this.eventHandlers[event]; _i < _a.length; _i++) {
            var callback = _a[_i];
            callback(data);
        }
        this.eventsEmitted[event] += 1;
    };
    EventEmitter.prototype.emitted = function (event) {
        if (typeof this.eventsEmitted[event] === 'undefined') {
            return 0;
        }
        return this.eventsEmitted[event];
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;

},{}],12:[function(require,module,exports){
"use strict";
var auth_1 = require('./auth');
exports.Auth = auth_1.Auth;
exports.AuthType = auth_1.AuthType;
exports.BasicAuth = auth_1.BasicAuth;
exports.CustomAuth = auth_1.CustomAuth;
exports.TwitterAuth = auth_1.TwitterAuth;
exports.FacebookAuth = auth_1.FacebookAuth;
exports.GithubAuth = auth_1.GithubAuth;
exports.GoogleAuth = auth_1.GoogleAuth;
exports.InstagramAuth = auth_1.InstagramAuth;
exports.LinkedInAuth = auth_1.LinkedInAuth;
var client_1 = require('./client');
exports.Client = client_1.Client;
var config_1 = require('./config');
exports.Config = config_1.Config;
var cordova_1 = require('./cordova');
exports.Cordova = cordova_1.Cordova;
var core_1 = require('./core');
exports.Core = core_1.Core;
var deploy_1 = require('./deploy/deploy');
exports.Deploy = deploy_1.Deploy;
var device_1 = require('./device');
exports.Device = device_1.Device;
var di_1 = require('./di');
exports.DIContainer = di_1.Container;
var events_1 = require('./events');
exports.EventEmitter = events_1.EventEmitter;
var insights_1 = require('./insights');
exports.Insights = insights_1.Insights;
var logger_1 = require('./logger');
exports.Logger = logger_1.Logger;
var push_1 = require('./push/push');
exports.Push = push_1.Push;
var storage_1 = require('./storage');
exports.Storage = storage_1.Storage;
exports.LocalStorageStrategy = storage_1.LocalStorageStrategy;
exports.SessionStorageStrategy = storage_1.SessionStorageStrategy;
var user_1 = require('./user/user');
exports.UserContext = user_1.UserContext;
exports.User = user_1.User;
exports.SingleUserService = user_1.SingleUserService;

},{"./auth":2,"./client":3,"./config":4,"./cordova":5,"./core":6,"./deploy/deploy":7,"./device":8,"./di":9,"./events":11,"./insights":13,"./logger":14,"./push/push":17,"./storage":19,"./user/user":21}],13:[function(require,module,exports){
"use strict";
var Stat = (function () {
    function Stat(appId, stat, value) {
        if (value === void 0) { value = 1; }
        this.appId = appId;
        this.stat = stat;
        this.value = value;
        this.appId = appId;
        this.stat = stat;
        this.value = value;
        this.created = new Date();
    }
    Stat.prototype.toJSON = function () {
        return {
            app_id: this.appId,
            stat: this.stat,
            value: this.value,
            created: this.created.toISOString(),
        };
    };
    return Stat;
}());
exports.Stat = Stat;
var Insights = (function () {
    function Insights(deps, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.options = options;
        this.submitCount = Insights.SUBMIT_COUNT;
        this.app = deps.app;
        this.client = deps.client;
        this.logger = deps.logger;
        this.batch = [];
        if (options.intervalSubmit) {
            setInterval(function () {
                _this.submit();
            }, options.intervalSubmit);
        }
        if (options.submitCount) {
            this.submitCount = options.submitCount;
        }
    }
    Insights.prototype.track = function (stat, value) {
        if (value === void 0) { value = 1; }
        this.trackStat(new Stat(this.app.id, stat, value));
    };
    Insights.prototype.trackStat = function (stat) {
        this.batch.push(stat);
        if (this.shouldSubmit()) {
            this.submit();
        }
    };
    Insights.prototype.shouldSubmit = function () {
        return this.batch.length >= this.submitCount;
    };
    Insights.prototype.submit = function () {
        var _this = this;
        if (this.batch.length === 0) {
            return;
        }
        var insights = [];
        for (var _i = 0, _a = this.batch; _i < _a.length; _i++) {
            var stat = _a[_i];
            insights.push(stat.toJSON());
        }
        this.client.post('/insights')
            .send({ 'insights': insights })
            .end(function (err, res) {
            if (err) {
                _this.logger.error('Ionic Insights: Could not send insights.', err);
            }
            else {
                _this.logger.info('Ionic Insights: Sent insights.');
            }
        });
        this.batch = [];
    };
    Insights.SUBMIT_COUNT = 100;
    return Insights;
}());
exports.Insights = Insights;

},{}],14:[function(require,module,exports){
"use strict";
var Logger = (function () {
    function Logger() {
        this.silent = false;
        this.infofn = console.log.bind(console);
        this.warnfn = console.warn.bind(console);
        this.errorfn = console.error.bind(console);
    }
    Logger.prototype.info = function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        if (!this.silent) {
            this.infofn.apply(this, [message].concat(optionalParams));
        }
    };
    Logger.prototype.warn = function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        if (!this.silent) {
            this.warnfn.apply(this, [message].concat(optionalParams));
        }
    };
    Logger.prototype.error = function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        this.errorfn.apply(this, [message].concat(optionalParams));
    };
    return Logger;
}());
exports.Logger = Logger;

},{}],15:[function(require,module,exports){
"use strict";
var DeferredPromise = (function () {
    function DeferredPromise() {
        var _this = this;
        this.promise = new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
    }
    return DeferredPromise;
}());
exports.DeferredPromise = DeferredPromise;

},{}],16:[function(require,module,exports){
"use strict";
var PushMessage = (function () {
    function PushMessage() {
    }
    PushMessage.fromPluginData = function (data) {
        var message = new PushMessage();
        message.raw = data;
        message.text = data.message;
        message.title = data.title;
        message.count = data.count;
        message.sound = data.sound;
        message.image = data.image;
        message.app = {
            'asleep': !data.additionalData.foreground,
            'closed': data.additionalData.coldstart
        };
        message.payload = data.additionalData['payload'];
        return message;
    };
    PushMessage.prototype.toString = function () {
        return "<PushMessage [\"" + this.title + "\"]>";
    };
    return PushMessage;
}());
exports.PushMessage = PushMessage;

},{}],17:[function(require,module,exports){
"use strict";
var promise_1 = require('../promise');
var token_1 = require('./token');
var message_1 = require('./message');
var Push = (function () {
    function Push(deps, options) {
        if (options === void 0) { options = {}; }
        this.blockRegistration = false;
        this.blockUnregister = false;
        this.blockSaveToken = false;
        this.registered = false;
        this.app = deps.app;
        this.config = deps.config;
        this.auth = deps.auth;
        this.userService = deps.userService;
        this.device = deps.device;
        this.client = deps.client;
        this.emitter = deps.emitter;
        this.storage = deps.storage;
        this.logger = deps.logger;
        // Check for the required values to use this service
        if (!this.app.id) {
            this.logger.error('Ionic Push: no app_id found. (http://docs.ionic.io/docs/io-install)');
            return;
        }
        else if (this.device.isAndroid() && !this.app.gcmKey) {
            this.logger.error('Ionic Push: GCM project number not found (http://docs.ionic.io/docs/push-android-setup)');
            return;
        }
        if (!options.pluginConfig) {
            options.pluginConfig = {};
        }
        if (this.device.isAndroid()) {
            // inject gcm key for PushPlugin
            if (!options.pluginConfig.android) {
                options.pluginConfig.android = {};
            }
            if (!options.pluginConfig.android.senderId) {
                options.pluginConfig.android.senderID = this.app.gcmKey;
            }
        }
        this.options = options;
    }
    Object.defineProperty(Push.prototype, "token", {
        get: function () {
            if (!this._token) {
                this._token = new token_1.PushToken(this.storage.get('ionic_io_push_token').token);
            }
            return this._token;
        },
        set: function (val) {
            if (!val) {
                this.storage.delete('ionic_io_push_token');
            }
            else {
                this.storage.set('ionic_io_push_token', { 'token': val.token });
            }
            this._token = val;
        },
        enumerable: true,
        configurable: true
    });
    Push.prototype.saveToken = function (token, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var deferred = new promise_1.DeferredPromise();
        var tokenData = {
            'token': token.token,
            'app_id': this.config.get('app_id')
        };
        if (!options.ignore_user) {
            var user = this.userService.current();
            if (this.auth.isAuthenticated()) {
                tokenData.user_id = user.id;
            }
        }
        if (!this.blockSaveToken) {
            this.client.post('/push/tokens')
                .send(tokenData)
                .end(function (err, res) {
                if (err) {
                    _this.blockSaveToken = false;
                    _this.logger.error('Ionic Push:', err);
                    deferred.reject(err);
                }
                else {
                    _this.blockSaveToken = false;
                    _this.logger.info('Ionic Push: saved push token: ' + token);
                    if (tokenData.user_id) {
                        _this.logger.info('Ionic Push: added push token to user: ' + tokenData.user_id);
                    }
                    token.saved = true;
                    deferred.resolve(token);
                }
            });
        }
        else {
            deferred.reject(new Error('A token save operation is already in progress.'));
        }
        return deferred.promise;
    };
    /**
     * Registers the device with GCM/APNS to get a device token
     */
    Push.prototype.register = function () {
        var _this = this;
        var deferred = new promise_1.DeferredPromise();
        if (this.blockRegistration) {
            deferred.reject(new Error('Another registration is already in progress.'));
        }
        else {
            this.blockRegistration = true;
            this.emitter.once('device:ready', function () {
                var pushPlugin = _this._getPushPlugin();
                if (pushPlugin) {
                    _this.plugin = pushPlugin.init(_this.options.pluginConfig);
                    _this.plugin.on('registration', function (data) {
                        _this.blockRegistration = false;
                        _this.token = new token_1.PushToken(data.registrationId);
                        _this.token.registered = true;
                        deferred.resolve(_this.token);
                    });
                    _this._callbackRegistration();
                    _this.registered = true;
                }
                else {
                    deferred.reject(new Error('Push plugin not found! See logs.'));
                }
            });
        }
        return deferred.promise;
    };
    /**
     * Invalidate the current GCM/APNS token
     */
    Push.prototype.unregister = function () {
        var _this = this;
        var deferred = new promise_1.DeferredPromise();
        if (!this.blockUnregister) {
            var pushToken_1 = this.token;
            if (!pushToken_1) {
                deferred.resolve();
            }
            else {
                var tokenData = {
                    'token': pushToken_1.token,
                    'app_id': this.config.get('app_id')
                };
                if (this.plugin) {
                    this.plugin.unregister(function () { }, function () { });
                }
                this.client.post('/push/tokens/invalidate')
                    .send(tokenData)
                    .end(function (err, res) {
                    _this.blockUnregister = false;
                    if (err) {
                        _this.logger.error('Ionic Push:', err);
                        deferred.reject(err);
                    }
                    else {
                        _this.logger.info('Ionic Push: unregistered push token: ' + pushToken_1.token);
                        _this.token = null;
                        deferred.resolve();
                    }
                });
            }
        }
        else {
            deferred.reject(new Error('An unregister operation is already in progress.'));
        }
        this.blockUnregister = true;
        return deferred.promise;
    };
    /**
     * Registers callbacks with the PushPlugin
     */
    Push.prototype._callbackRegistration = function () {
        var _this = this;
        this.plugin.on('registration', function (data) {
            _this.token = new token_1.PushToken(data.registrationId);
            if (_this.options.debug) {
                _this.logger.info('Ionic Push (debug): device token registered: ' + _this.token);
            }
            _this.emitter.emit('push:register', { 'token': data.registrationId });
        });
        this.plugin.on('notification', function (data) {
            var message = message_1.PushMessage.fromPluginData(data);
            if (_this.options.debug) {
                _this.logger.info('Ionic Push (debug): notification received: ' + message);
            }
            _this.emitter.emit('push:notification', { 'message': message, 'raw': data });
        });
        this.plugin.on('error', function (e) {
            if (_this.options.debug) {
                _this.logger.error('Ionic Push (debug): unexpected error occured.');
                _this.logger.error('Ionic Push:', e);
            }
            _this.emitter.emit('push:error', { 'err': e });
        });
    };
    Push.prototype._getPushPlugin = function () {
        var plugin = window.PushNotification;
        if (!plugin) {
            if (this.device.isIOS() || this.device.isAndroid()) {
                this.logger.error('Ionic Push: PushNotification plugin is required. Have you run `ionic plugin add phonegap-plugin-push` ?');
            }
            else {
                this.logger.warn('Ionic Push: Disabled! Native push notifications will not work in a browser. Run your app on an actual device to use push.');
            }
        }
        return plugin;
    };
    return Push;
}());
exports.Push = Push;

},{"../promise":15,"./message":16,"./token":18}],18:[function(require,module,exports){
"use strict";
var PushToken = (function () {
    function PushToken(token) {
        this.token = token;
        this.registered = false;
        this.saved = false;
        this.token = token;
    }
    PushToken.prototype.toString = function () {
        return "<PushToken [" + this.token + "]>";
    };
    return PushToken;
}());
exports.PushToken = PushToken;

},{}],19:[function(require,module,exports){
"use strict";
var LocalStorageStrategy = (function () {
    function LocalStorageStrategy() {
    }
    LocalStorageStrategy.prototype.get = function (key) {
        return localStorage.getItem(key);
    };
    LocalStorageStrategy.prototype.remove = function (key) {
        return localStorage.removeItem(key);
    };
    LocalStorageStrategy.prototype.set = function (key, value) {
        return localStorage.setItem(key, value);
    };
    return LocalStorageStrategy;
}());
exports.LocalStorageStrategy = LocalStorageStrategy;
var SessionStorageStrategy = (function () {
    function SessionStorageStrategy() {
    }
    SessionStorageStrategy.prototype.get = function (key) {
        return sessionStorage.getItem(key);
    };
    SessionStorageStrategy.prototype.remove = function (key) {
        return sessionStorage.removeItem(key);
    };
    SessionStorageStrategy.prototype.set = function (key, value) {
        return sessionStorage.setItem(key, value);
    };
    return SessionStorageStrategy;
}());
exports.SessionStorageStrategy = SessionStorageStrategy;
var Storage = (function () {
    function Storage(deps, options) {
        if (options === void 0) { options = { 'cache': true }; }
        this.options = options;
        this.strategy = deps.strategy;
        this.storageCache = {};
    }
    Storage.prototype.set = function (key, value) {
        var json = JSON.stringify(value);
        this.strategy.set(key, json);
        if (this.options.cache) {
            this.storageCache[key] = value;
        }
    };
    Storage.prototype.delete = function (key) {
        this.strategy.remove(key);
        if (this.options.cache) {
            delete this.storageCache[key];
        }
    };
    Storage.prototype.get = function (key) {
        if (this.options.cache) {
            var cached = this.storageCache[key];
            if (cached) {
                return cached;
            }
        }
        var json = this.strategy.get(key);
        if (!json) {
            return null;
        }
        try {
            var value = JSON.parse(json);
            if (this.options.cache) {
                this.storageCache[key] = value;
            }
            return value;
        }
        catch (err) {
            return null;
        }
    };
    return Storage;
}());
exports.Storage = Storage;

},{}],20:[function(require,module,exports){
"use strict";
var dataTypeMapping = {};
var DataTypeSchema = (function () {
    function DataTypeSchema(properties) {
        this.data = {};
        this.setProperties(properties);
    }
    DataTypeSchema.prototype.setProperties = function (properties) {
        if (properties instanceof Object) {
            for (var x in properties) {
                this.data[x] = properties[x];
            }
        }
    };
    DataTypeSchema.prototype.toJSON = function () {
        var data = this.data;
        return {
            '__Ionic_DataTypeSchema': data.name,
            'value': data.value
        };
    };
    DataTypeSchema.prototype.isValid = function () {
        if (this.data.name && this.data.value) {
            return true;
        }
        return false;
    };
    return DataTypeSchema;
}());
exports.DataTypeSchema = DataTypeSchema;
var DataType = (function () {
    function DataType() {
    }
    DataType.get = function (name, value) {
        if (dataTypeMapping[name]) {
            return new dataTypeMapping[name](value);
        }
        return false;
    };
    DataType.getMapping = function () {
        return dataTypeMapping;
    };
    Object.defineProperty(DataType, "Schema", {
        get: function () {
            return DataTypeSchema;
        },
        enumerable: true,
        configurable: true
    });
    DataType.register = function (name, cls) {
        dataTypeMapping[name] = cls;
    };
    return DataType;
}());
exports.DataType = DataType;
var UniqueArray = (function () {
    function UniqueArray(value) {
        this.data = [];
        if (value instanceof Array) {
            for (var x in value) {
                this.push(value[x]);
            }
        }
    }
    UniqueArray.prototype.toJSON = function () {
        var data = this.data;
        var schema = new DataTypeSchema({ 'name': 'UniqueArray', 'value': data });
        return schema.toJSON();
    };
    UniqueArray.fromStorage = function (value) {
        return new UniqueArray(value);
    };
    UniqueArray.prototype.push = function (value) {
        if (this.data.indexOf(value) === -1) {
            this.data.push(value);
        }
    };
    UniqueArray.prototype.pull = function (value) {
        var index = this.data.indexOf(value);
        this.data.splice(index, 1);
    };
    return UniqueArray;
}());
exports.UniqueArray = UniqueArray;
DataType.register('UniqueArray', UniqueArray);

},{}],21:[function(require,module,exports){
"use strict";
var promise_1 = require('../promise');
var data_types_1 = require('./data-types');
var UserContext = (function () {
    function UserContext(deps) {
        this.config = deps.config;
        this.storage = deps.storage;
    }
    Object.defineProperty(UserContext.prototype, "label", {
        get: function () {
            return 'ionic_io_user_' + this.config.get('app_id');
        },
        enumerable: true,
        configurable: true
    });
    UserContext.prototype.unstore = function () {
        this.storage.delete(this.label);
    };
    UserContext.prototype.store = function (user) {
        this.storage.set(this.label, user.serializeForStorage());
    };
    UserContext.prototype.load = function (user) {
        var data = this.storage.get(this.label);
        if (data) {
            user.id = data.id;
            user.data = new UserData(data.data);
            user.details = data.details || {};
            user.fresh = data.fresh;
            return user;
        }
        return;
    };
    return UserContext;
}());
exports.UserContext = UserContext;
var UserData = (function () {
    function UserData(data) {
        if (data === void 0) { data = {}; }
        this.data = {};
        if ((typeof data === 'object')) {
            this.data = data;
            this.deserializerDataTypes();
        }
    }
    UserData.prototype.deserializerDataTypes = function () {
        if (this.data) {
            for (var x in this.data) {
                // if we have an object, let's check for custom data types
                if (typeof this.data[x] === 'object') {
                    // do we have a custom type?
                    if (this.data[x].__Ionic_DataTypeSchema) {
                        var name = this.data[x].__Ionic_DataTypeSchema;
                        var mapping = data_types_1.DataType.getMapping();
                        if (mapping[name]) {
                            // we have a custom type and a registered class, give the custom data type
                            // from storage
                            this.data[x] = mapping[name].fromStorage(this.data[x].value);
                        }
                    }
                }
            }
        }
    };
    UserData.prototype.get = function (key, defaultValue) {
        if (this.data.hasOwnProperty(key)) {
            return this.data[key];
        }
        else {
            if (defaultValue === 0 || defaultValue === false) {
                return defaultValue;
            }
            return defaultValue || null;
        }
    };
    UserData.prototype.set = function (key, value) {
        this.data[key] = value;
    };
    UserData.prototype.unset = function (key) {
        delete this.data[key];
    };
    return UserData;
}());
exports.UserData = UserData;
var User = (function () {
    function User(deps) {
        this.details = {};
        this.service = deps.service;
        this.fresh = true;
        this._unset = {};
        this.data = new UserData();
    }
    User.prototype.isAnonymous = function () {
        if (!this.id) {
            return true;
        }
        else {
            return false;
        }
    };
    User.prototype.get = function (key, defaultValue) {
        return this.data.get(key, defaultValue);
    };
    User.prototype.set = function (key, value) {
        delete this._unset[key];
        return this.data.set(key, value);
    };
    User.prototype.unset = function (key) {
        this._unset[key] = true;
        return this.data.unset(key);
    };
    User.prototype.clear = function () {
        this.id = null;
        this.data = new UserData();
        this.details = {};
        this.fresh = true;
    };
    User.prototype.save = function () {
        this._unset = {};
        return this.service.save();
    };
    User.prototype.delete = function () {
        return this.service.delete();
    };
    User.prototype.load = function (id) {
        return this.service.load(id);
    };
    User.prototype.store = function () {
        this.service.store();
    };
    User.prototype.unstore = function () {
        this.service.unstore();
    };
    User.prototype.serializeForAPI = function () {
        return {
            'email': this.details.email,
            'password': this.details.password,
            'username': this.details.username,
            'image': this.details.image,
            'name': this.details.name,
            'custom': this.data.data
        };
    };
    User.prototype.serializeForStorage = function () {
        return {
            'id': this.id,
            'data': this.data.data,
            'details': this.details,
            'fresh': this.fresh
        };
    };
    User.prototype.toString = function () {
        return "<User [" + (this.isAnonymous() ? 'anonymous' : this.id) + "]>";
    };
    return User;
}());
exports.User = User;
var SingleUserService = (function () {
    function SingleUserService(deps, config) {
        if (config === void 0) { config = {}; }
        this.config = config;
        this.client = deps.client;
        this.context = deps.context;
    }
    SingleUserService.prototype.current = function () {
        if (!this.user) {
            this.user = this.context.load(new User({ 'service': this }));
        }
        if (!this.user) {
            this.user = new User({ 'service': this });
        }
        return this.user;
    };
    SingleUserService.prototype.store = function () {
        this.context.store(this.current());
    };
    SingleUserService.prototype.unstore = function () {
        this.context.unstore();
    };
    SingleUserService.prototype.load = function (id) {
        if (id === void 0) { id = 'self'; }
        var deferred = new promise_1.DeferredPromise();
        var user = this.current();
        this.client.get("/users/" + id)
            .end(function (err, res) {
            if (err) {
                deferred.reject(err);
            }
            else {
                user.id = res.body.data.uuid;
                user.data = new UserData(res.body.data.custom);
                user.details = res.body.data.details;
                user.fresh = false;
                deferred.resolve();
            }
        });
        return deferred.promise;
    };
    SingleUserService.prototype.delete = function () {
        var deferred = new promise_1.DeferredPromise();
        if (this.user.isAnonymous()) {
            deferred.reject(new Error('User is anonymous and cannot be deleted from the API.'));
        }
        else {
            this.unstore();
            this.client.delete("/users/" + this.user.id)
                .end(function (err, res) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve();
                }
            });
        }
        return deferred.promise;
    };
    SingleUserService.prototype.save = function () {
        var _this = this;
        var deferred = new promise_1.DeferredPromise();
        this.store();
        if (this.user.isAnonymous()) {
            deferred.reject(new Error('User is anonymous and cannot be updated in the API. Use load(<id>) or signup a user using auth.'));
        }
        else {
            this.client.patch("/users/" + this.user.id)
                .send(this.user.serializeForAPI())
                .end(function (err, res) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    _this.user.fresh = false;
                    deferred.resolve();
                }
            });
        }
        return deferred.promise;
    };
    return SingleUserService;
}());
exports.SingleUserService = SingleUserService;

},{"../promise":15,"./data-types":20}],22:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],23:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],24:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');
var requestBase = require('./request-base');
var isObject = require('./is-object');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Expose `request`.
 */

var request = module.exports = require('./request').bind(null, Request);

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
        }
      }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (Array.isArray(val)) {
    return val.forEach(function(v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  }
  pairs.push(encodeURIComponent(key)
    + '=' + encodeURIComponent(val));
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = self.xhr && self.xhr.status ? self.xhr.status : null;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter` and `requestBase`.
 */

Emitter(Request.prototype);
for (var key in requestBase) {
  Request.prototype[key] = requestBase[key];
}

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set responseType to `val`. Presently valid responseTypes are 'blob' and 
 * 'arraybuffer'.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (!options) {
    options = {
      type: 'basic'
    }
  }

  switch (options.type) {
    case 'basic':
      var str = btoa(user + ':' + pass);
      this.set('Authorization', 'Basic ' + str);
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
  }
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  this._getFormData().append(field, file, filename || file.name);
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this._header['content-type'];

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * @deprecated
 */
Response.prototype.parse = function serialize(fn){
  if (root.console) {
    console.warn("Client-side parse() method has been renamed to serialize(). This method is not compatible with superagent v2.0");
  }
  this.serialize(fn);
  return this;
};

Response.prototype.serialize = function serialize(fn){
  this._parser = fn;
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = 'download';
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  if (this.username && this.password) {
    xhr.open(this.method, this.url, true, this.username, this.password);
  } else {
    xhr.open(this.method, this.url, true);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};


/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":25,"./request":27,"./request-base":26,"emitter":22,"reduce":23}],25:[function(require,module,exports){
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null != obj && 'object' == typeof obj;
}

module.exports = isObject;

},{}],26:[function(require,module,exports){
/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

exports.clearTimeout = function _clearTimeout(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Force given parser
 *
 * Sets the body parser no matter type.
 *
 * @param {Function}
 * @api public
 */

exports.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

exports.timeout = function timeout(ms){
  this._timeout = ms;
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

exports.then = function then(fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Allow for extension
 */

exports.use = function use(fn) {
  fn(this);
  return this;
}


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

exports.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

exports.getHeader = exports.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

exports.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
exports.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
exports.field = function(name, val) {
  this._getFormData().append(name, val);
  return this;
};

},{"./is-object":25}],27:[function(require,module,exports){
// The node and browser modules expose versions of this with the
// appropriate constructor function bound as first argument
/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(RequestConstructor, method, url) {
  // callback
  if ('function' == typeof url) {
    return new RequestConstructor('GET', method).end(url);
  }

  // url first
  if (2 == arguments.length) {
    return new RequestConstructor('GET', method);
  }

  return new RequestConstructor(method, url);
}

module.exports = request;

},{}],28:[function(require,module,exports){
// Angular 1 modules and factories for the bundle

if (typeof angular === 'object' && angular.module) {

  angular.element(document).ready(function() {
    Ionic.cordova.bootstrap();
  });

  angular.module('ionic.cloud', [])

  .provider('$ionicCloudConfig', function() {
    var config = Ionic.config;

    this.register = function(settings) {
      config.register(settings.core);
      if (settings.logger) {
        var logger = Ionic.logger;
        logger.silent = settings.logger.silent;
      }
    };

    this.$get = function() {
      return config;
    };
  })

  .provider('$ionicCloud', ['$ionicCloudConfigProvider', function($ionicCloudConfigProvider) {
    this.init = function(value) {
      $ionicCloudConfigProvider.register(value);
    };

    this.$get = [function() {
      return Ionic.core;
    }];
  }])

  .factory('$ionicCloudLogger', [function() {
    return Ionic.logger;
  }])

  .factory('$ionicEventEmitter', [function() {
    return Ionic.eventEmitter;
  }])

  .factory('$ionicCloudDevice', [function() {
    return Ionic.device;
  }])

  .factory('$ionicCloudCordova', [function() {
    return Ionic.cordova;
  }])

  .factory('$ionicCloudClient', [function() {
    return Ionic.client;
  }])

  .factory('$ionicSingleUserService', [function() {
    return Ionic.singleUserService;
  }])

  .factory('$ionicUser', ['$ionicSingleUserService', function($ionicSingleUserService) {
    return $ionicSingleUserService.current();
  }])

  .factory('$ionicAuth', [function() {
    return Ionic.auth;
  }])

  .factory('$ionicPush', [function() {
    return Ionic.push;
  }])

  .factory('$ionicDeploy', [function() {
    return Ionic.deploy;
  }])

  .run([function() {
    // TODO
  }]);

}

},{}],29:[function(require,module,exports){
var App = require("./../dist/es5/app").App;
var Core = require("./../dist/es5/core").Core;
var DataType = require("./../dist/es5/user/data-types").DataType;
var Deploy = require("./../dist/es5/deploy/deploy").Deploy;
var EventEmitter = require("./../dist/es5/events").EventEmitter;
var Logger = require("./../dist/es5/logger").Logger;
var Push = require("./../dist/es5/push/push").Push;
var PushMessage = require("./../dist/es5/push/message").PushMessage;
var PushToken = require("./../dist/es5/push/token").PushToken;
var auth = require("./../dist/es5/auth");
var client = require("./../dist/es5/client");
var config = require("./../dist/es5/config");
var cordova = require("./../dist/es5/cordova");
var device = require("./../dist/es5/device");
var di = require("./../dist/es5/di");
var promise = require("./../dist/es5/promise");
var storage = require("./../dist/es5/storage");
var user = require("./../dist/es5/user/user");

// Declare the window object
window.Ionic = new di.Container();

// Ionic Modules
Ionic.Core = Core;
Ionic.User = user.User;
Ionic.Auth = auth.Auth;
Ionic.Deploy = Deploy;
Ionic.Push = Push;
Ionic.PushToken = PushToken;
Ionic.PushMessage = PushMessage;

// DataType Namespace
Ionic.DataType = DataType;
Ionic.DataTypes = DataType.getMapping();

// Cloud Namespace
Ionic.Cloud = {};
Ionic.Cloud.App = App;
Ionic.Cloud.AuthType = auth.AuthType;
Ionic.Cloud.AuthTypes = {};
Ionic.Cloud.AuthTypes.BasicAuth = auth.BasicAuth;
Ionic.Cloud.AuthTypes.CustomAuth = auth.CustomAuth;
Ionic.Cloud.AuthTypes.TwitterAuth = auth.TwitterAuth;
Ionic.Cloud.AuthTypes.FacebookAuth = auth.FacebookAuth;
Ionic.Cloud.AuthTypes.GithubAuth = auth.GithubAuth;
Ionic.Cloud.AuthTypes.GoogleAuth = auth.GoogleAuth;
Ionic.Cloud.AuthTypes.InstagramAuth = auth.InstagramAuth;
Ionic.Cloud.AuthTypes.LinkedInAuth = auth.LinkedInAuth;
Ionic.Cloud.Cordova = cordova.Cordova;
Ionic.Cloud.Client = client.Client;
Ionic.Cloud.Device = device.Device;
Ionic.Cloud.EventEmitter = EventEmitter;
Ionic.Cloud.Logger = Logger;
Ionic.Cloud.Promise = promise.Promise;
Ionic.Cloud.DeferredPromise = promise.DeferredPromise;
Ionic.Cloud.Storage = storage.Storage;
Ionic.Cloud.UserContext = user.UserContext;
Ionic.Cloud.SingleUserService = user.SingleUserService;
Ionic.Cloud.AuthTokenContext = auth.AuthTokenContext;
Ionic.Cloud.CombinedAuthTokenContext = auth.CombinedAuthTokenContext;
Ionic.Cloud.LocalStorageStrategy = storage.LocalStorageStrategy;
Ionic.Cloud.SessionStorageStrategy = storage.SessionStorageStrategy;
Ionic.Cloud.Config = config.Config;

},{"./../dist/es5/app":1,"./../dist/es5/auth":2,"./../dist/es5/client":3,"./../dist/es5/config":4,"./../dist/es5/cordova":5,"./../dist/es5/core":6,"./../dist/es5/deploy/deploy":7,"./../dist/es5/device":8,"./../dist/es5/di":9,"./../dist/es5/events":11,"./../dist/es5/logger":14,"./../dist/es5/promise":15,"./../dist/es5/push/message":16,"./../dist/es5/push/push":17,"./../dist/es5/push/token":18,"./../dist/es5/storage":19,"./../dist/es5/user/data-types":20,"./../dist/es5/user/user":21}]},{},[29,28,12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2VzNS9hcHAuanMiLCJkaXN0L2VzNS9hdXRoLmpzIiwiZGlzdC9lczUvY2xpZW50LmpzIiwiZGlzdC9lczUvY29uZmlnLmpzIiwiZGlzdC9lczUvY29yZG92YS5qcyIsImRpc3QvZXM1L2NvcmUuanMiLCJkaXN0L2VzNS9kZXBsb3kvZGVwbG95LmpzIiwiZGlzdC9lczUvZGV2aWNlLmpzIiwiZGlzdC9lczUvZGkuanMiLCJkaXN0L2VzNS9lcnJvcnMuanMiLCJkaXN0L2VzNS9ldmVudHMuanMiLCJkaXN0L2VzNS9pbmRleC5qcyIsImRpc3QvZXM1L2luc2lnaHRzLmpzIiwiZGlzdC9lczUvbG9nZ2VyLmpzIiwiZGlzdC9lczUvcHJvbWlzZS5qcyIsImRpc3QvZXM1L3B1c2gvbWVzc2FnZS5qcyIsImRpc3QvZXM1L3B1c2gvcHVzaC5qcyIsImRpc3QvZXM1L3B1c2gvdG9rZW4uanMiLCJkaXN0L2VzNS9zdG9yYWdlLmpzIiwiZGlzdC9lczUvdXNlci9kYXRhLXR5cGVzLmpzIiwiZGlzdC9lczUvdXNlci91c2VyLmpzIiwibm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjZS1jb21wb25lbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbGliL2lzLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcmFnZW50L2xpYi9yZXF1ZXN0LWJhc2UuanMiLCJub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvcmVxdWVzdC5qcyIsInNyYy9hbmd1bGFyLmpzIiwic3JjL2VzNS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgQXBwID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBcHAoaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgfVxuICAgIEFwcC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIjxBcHAgW1wiICsgdGhpcy5pZCArIFwiXT5cIjtcbiAgICB9O1xuICAgIHJldHVybiBBcHA7XG59KCkpO1xuZXhwb3J0cy5BcHAgPSBBcHA7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIGVycm9yc18xID0gcmVxdWlyZSgnLi9lcnJvcnMnKTtcbnZhciBwcm9taXNlXzEgPSByZXF1aXJlKCcuL3Byb21pc2UnKTtcbnZhciBBdXRoVG9rZW5Db250ZXh0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBdXRoVG9rZW5Db250ZXh0KGRlcHMsIGxhYmVsKSB7XG4gICAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICAgICAgdGhpcy5zdG9yYWdlID0gZGVwcy5zdG9yYWdlO1xuICAgIH1cbiAgICBBdXRoVG9rZW5Db250ZXh0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0b3JhZ2UuZ2V0KHRoaXMubGFiZWwpO1xuICAgIH07XG4gICAgQXV0aFRva2VuQ29udGV4dC5wcm90b3R5cGUuc3RvcmUgPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgdGhpcy5zdG9yYWdlLnNldCh0aGlzLmxhYmVsLCB0b2tlbik7XG4gICAgfTtcbiAgICBBdXRoVG9rZW5Db250ZXh0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc3RvcmFnZS5yZW1vdmUodGhpcy5sYWJlbCk7XG4gICAgfTtcbiAgICByZXR1cm4gQXV0aFRva2VuQ29udGV4dDtcbn0oKSk7XG5leHBvcnRzLkF1dGhUb2tlbkNvbnRleHQgPSBBdXRoVG9rZW5Db250ZXh0O1xudmFyIENvbWJpbmVkQXV0aFRva2VuQ29udGV4dCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29tYmluZWRBdXRoVG9rZW5Db250ZXh0KGRlcHMsIGxhYmVsKSB7XG4gICAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICAgICAgdGhpcy5zdG9yYWdlID0gZGVwcy5zdG9yYWdlO1xuICAgICAgICB0aGlzLnRlbXBTdG9yYWdlID0gZGVwcy50ZW1wU3RvcmFnZTtcbiAgICB9XG4gICAgQ29tYmluZWRBdXRoVG9rZW5Db250ZXh0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwZXJtVG9rZW4gPSB0aGlzLnN0b3JhZ2UuZ2V0KHRoaXMubGFiZWwpO1xuICAgICAgICB2YXIgdGVtcFRva2VuID0gdGhpcy50ZW1wU3RvcmFnZS5nZXQodGhpcy5sYWJlbCk7XG4gICAgICAgIHZhciB0b2tlbiA9IHRlbXBUb2tlbiB8fCBwZXJtVG9rZW47XG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9O1xuICAgIENvbWJpbmVkQXV0aFRva2VuQ29udGV4dC5wcm90b3R5cGUuc3RvcmUgPSBmdW5jdGlvbiAodG9rZW4sIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0geyAncGVybWFuZW50JzogdHJ1ZSB9OyB9XG4gICAgICAgIGlmIChvcHRpb25zLnBlcm1hbmVudCkge1xuICAgICAgICAgICAgdGhpcy5zdG9yYWdlLnNldCh0aGlzLmxhYmVsLCB0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBTdG9yYWdlLnNldCh0aGlzLmxhYmVsLCB0b2tlbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbWJpbmVkQXV0aFRva2VuQ29udGV4dC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN0b3JhZ2UucmVtb3ZlKHRoaXMubGFiZWwpO1xuICAgICAgICB0aGlzLnRlbXBTdG9yYWdlLnJlbW92ZSh0aGlzLmxhYmVsKTtcbiAgICB9O1xuICAgIHJldHVybiBDb21iaW5lZEF1dGhUb2tlbkNvbnRleHQ7XG59KCkpO1xuZXhwb3J0cy5Db21iaW5lZEF1dGhUb2tlbkNvbnRleHQgPSBDb21iaW5lZEF1dGhUb2tlbkNvbnRleHQ7XG5mdW5jdGlvbiBnZXRBdXRoRXJyb3JEZXRhaWxzKGVycikge1xuICAgIHZhciBkZXRhaWxzID0gW107XG4gICAgdHJ5IHtcbiAgICAgICAgZGV0YWlscyA9IGVyci5yZXNwb25zZS5ib2R5LmVycm9yLmRldGFpbHM7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGU7XG4gICAgfVxuICAgIHJldHVybiBkZXRhaWxzO1xufVxudmFyIEF1dGggPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEF1dGgoZGVwcywgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmVtaXR0ZXIgPSBkZXBzLmVtaXR0ZXI7XG4gICAgICAgIHRoaXMuYXV0aE1vZHVsZXMgPSBkZXBzLmF1dGhNb2R1bGVzO1xuICAgICAgICB0aGlzLnRva2VuQ29udGV4dCA9IGRlcHMudG9rZW5Db250ZXh0O1xuICAgICAgICB0aGlzLnVzZXJTZXJ2aWNlID0gZGVwcy51c2VyU2VydmljZTtcbiAgICB9XG4gICAgQXV0aC5wcm90b3R5cGUuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9rZW4gPSB0aGlzLnRva2VuQ29udGV4dC5nZXQoKTtcbiAgICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBBdXRoLnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uIChtb2R1bGVJZCwgZGF0YSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7ICdyZW1lbWJlcic6IHRydWUgfTsgfVxuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuYXV0aE1vZHVsZXNbbW9kdWxlSWRdO1xuICAgICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQXV0aGVudGljYXRpb24gY2xhc3MgaXMgaW52YWxpZCBvciBtaXNzaW5nOicgKyBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29udGV4dC5hdXRoZW50aWNhdGUoZGF0YSkudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgIF90aGlzLnN0b3JlVG9rZW4ob3B0aW9ucywgdG9rZW4pO1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnVzZXJTZXJ2aWNlLmxvYWQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXNlciA9IF90aGlzLnVzZXJTZXJ2aWNlLmN1cnJlbnQoKTtcbiAgICAgICAgICAgICAgICB1c2VyLnN0b3JlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBBdXRoLnByb3RvdHlwZS5zaWdudXAgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuYXV0aE1vZHVsZXMuYmFzaWM7XG4gICAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBdXRoZW50aWNhdGlvbiBjbGFzcyBpcyBpbnZhbGlkIG9yIG1pc3Npbmc6JyArIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb250ZXh0LnNpZ251cC5hcHBseShjb250ZXh0LCBbZGF0YV0pO1xuICAgIH07XG4gICAgQXV0aC5wcm90b3R5cGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRva2VuQ29udGV4dC5kZWxldGUoKTtcbiAgICAgICAgdmFyIHVzZXIgPSB0aGlzLnVzZXJTZXJ2aWNlLmN1cnJlbnQoKTtcbiAgICAgICAgdXNlci51bnN0b3JlKCk7XG4gICAgICAgIHVzZXIuY2xlYXIoKTtcbiAgICB9O1xuICAgIEF1dGgucHJvdG90eXBlLmdldFRva2VuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50b2tlbkNvbnRleHQuZ2V0KCk7XG4gICAgfTtcbiAgICBBdXRoLnByb3RvdHlwZS5zdG9yZVRva2VuID0gZnVuY3Rpb24gKG9wdGlvbnMsIHRva2VuKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHsgJ3JlbWVtYmVyJzogdHJ1ZSB9OyB9XG4gICAgICAgIHZhciBvcmlnaW5hbFRva2VuID0gdGhpcy5hdXRoVG9rZW47XG4gICAgICAgIHRoaXMuYXV0aFRva2VuID0gdG9rZW47XG4gICAgICAgIHRoaXMudG9rZW5Db250ZXh0LnN0b3JlKHRoaXMuYXV0aFRva2VuLCB7ICdwZXJtYW5lbnQnOiBvcHRpb25zLnJlbWVtYmVyIH0pO1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnYXV0aDp0b2tlbi1jaGFuZ2VkJywgeyAnb2xkJzogb3JpZ2luYWxUb2tlbiwgJ25ldyc6IHRoaXMuYXV0aFRva2VuIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIEF1dGg7XG59KCkpO1xuZXhwb3J0cy5BdXRoID0gQXV0aDtcbnZhciBBdXRoVHlwZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQXV0aFR5cGUoZGVwcykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGRlcHMuY29uZmlnO1xuICAgICAgICB0aGlzLmNsaWVudCA9IGRlcHMuY2xpZW50O1xuICAgIH1cbiAgICBBdXRoVHlwZS5wcm90b3R5cGUuaW5BcHBCcm93c2VyRmxvdyA9IGZ1bmN0aW9uIChvcHRpb25zLCBkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhID09PSB2b2lkIDApIHsgZGF0YSA9IHt9OyB9XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBwcm9taXNlXzEuRGVmZXJyZWRQcm9taXNlKCk7XG4gICAgICAgIGlmICghd2luZG93IHx8ICF3aW5kb3cuY29yZG92YSB8fCAhd2luZG93LmNvcmRvdmEuSW5BcHBCcm93c2VyKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKCdJbkFwcEJyb3dzZXIgcGx1Z2luIG1pc3NpbmcnKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gb3B0aW9ucy51cmlfbWV0aG9kID8gb3B0aW9ucy51cmlfbWV0aG9kIDogJ1BPU1QnO1xuICAgICAgICAgICAgdmFyIHByb3ZpZGVyID0gb3B0aW9ucy5wcm92aWRlciA/ICcvJyArIG9wdGlvbnMucHJvdmlkZXIgOiAnJztcbiAgICAgICAgICAgIHRoaXMuY2xpZW50LnJlcXVlc3QobWV0aG9kLCBcIi9hdXRoL2xvZ2luXCIgKyBwcm92aWRlcilcbiAgICAgICAgICAgICAgICAuc2VuZCh7XG4gICAgICAgICAgICAgICAgJ2FwcF9pZCc6IHRoaXMuY29uZmlnLmdldCgnYXBwX2lkJyksXG4gICAgICAgICAgICAgICAgJ2NhbGxiYWNrJzogb3B0aW9ucy5jYWxsYmFja191cmkgfHwgd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICAgICAgJ2RhdGEnOiBkYXRhXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lbmQoZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2MgPSByZXMuYm9keS5kYXRhLnVybDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBCcm93c2VyID0gd2luZG93LmNvcmRvdmEuSW5BcHBCcm93c2VyLm9wZW4obG9jLCAnX2JsYW5rJywgJ2xvY2F0aW9uPW5vLGNsZWFyY2FjaGU9eWVzLGNsZWFyc2Vzc2lvbmNhY2hlPXllcycpO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wQnJvd3Nlci5hZGRFdmVudExpc3RlbmVyKCdsb2Fkc3RhcnQnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEudXJsLnNsaWNlKDAsIDIwKSA9PT0gJ2h0dHA6Ly9hdXRoLmlvbmljLmlvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeVN0cmluZyA9IGRhdGEudXJsLnNwbGl0KCcjJylbMF0uc3BsaXQoJz8nKVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1QYXJ0cyA9IHF1ZXJ5U3RyaW5nLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyYW1QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFydCA9IHBhcmFtUGFydHNbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW3BhcnRbMF1dID0gcGFydFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEJyb3dzZXIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQnJvd3NlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYXJhbXMudG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIHJldHVybiBBdXRoVHlwZTtcbn0oKSk7XG5leHBvcnRzLkF1dGhUeXBlID0gQXV0aFR5cGU7XG52YXIgQmFzaWNBdXRoID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQmFzaWNBdXRoLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEJhc2ljQXV0aCgpIHtcbiAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIEJhc2ljQXV0aC5wcm90b3R5cGUuYXV0aGVudGljYXRlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTtcbiAgICAgICAgaWYgKCFkYXRhLmVtYWlsIHx8ICFkYXRhLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKCdlbWFpbCBhbmQgcGFzc3dvcmQgYXJlIHJlcXVpcmVkIGZvciBiYXNpYyBhdXRoZW50aWNhdGlvbicpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2xpZW50LnBvc3QoJy9hdXRoL2xvZ2luJylcbiAgICAgICAgICAgICAgICAuc2VuZCh7XG4gICAgICAgICAgICAgICAgJ2FwcF9pZCc6IHRoaXMuY29uZmlnLmdldCgnYXBwX2lkJyksXG4gICAgICAgICAgICAgICAgJ2VtYWlsJzogZGF0YS5lbWFpbCxcbiAgICAgICAgICAgICAgICAncGFzc3dvcmQnOiBkYXRhLnBhc3N3b3JkXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lbmQoZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzLmJvZHkuZGF0YS50b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgICBCYXNpY0F1dGgucHJvdG90eXBlLnNpZ251cCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBwcm9taXNlXzEuRGVmZXJyZWRQcm9taXNlKCk7XG4gICAgICAgIHZhciB1c2VyRGF0YSA9IHtcbiAgICAgICAgICAgICdhcHBfaWQnOiB0aGlzLmNvbmZpZy5nZXQoJ2FwcF9pZCcpLFxuICAgICAgICAgICAgJ2VtYWlsJzogZGF0YS5lbWFpbCxcbiAgICAgICAgICAgICdwYXNzd29yZCc6IGRhdGEucGFzc3dvcmRcbiAgICAgICAgfTtcbiAgICAgICAgLy8gb3B0aW9uYWwgZGV0YWlsc1xuICAgICAgICBpZiAoZGF0YS51c2VybmFtZSkge1xuICAgICAgICAgICAgdXNlckRhdGEudXNlcm5hbWUgPSBkYXRhLnVzZXJuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmltYWdlKSB7XG4gICAgICAgICAgICB1c2VyRGF0YS5pbWFnZSA9IGRhdGEuaW1hZ2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEubmFtZSkge1xuICAgICAgICAgICAgdXNlckRhdGEubmFtZSA9IGRhdGEubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5jdXN0b20pIHtcbiAgICAgICAgICAgIHVzZXJEYXRhLmN1c3RvbSA9IGRhdGEuY3VzdG9tO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xpZW50LnBvc3QoJy91c2VycycpXG4gICAgICAgICAgICAuc2VuZCh1c2VyRGF0YSlcbiAgICAgICAgICAgIC5lbmQoZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBkZXRhaWxzID0gZ2V0QXV0aEVycm9yRGV0YWlscyhlcnIpO1xuICAgICAgICAgICAgICAgIGlmIChkZXRhaWxzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXRhaWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGV0YWlsID0gZGV0YWlsc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGV0YWlsID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXRhaWwuZXJyb3JfdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChkZXRhaWwuZXJyb3JfdHlwZSArICdfJyArIGRldGFpbC5wYXJhbWV0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IGVycm9yc18xLkRldGFpbGVkRXJyb3IoJ0Vycm9yIGNyZWF0aW5nIHVzZXInLCBlcnJvcnMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gICAgcmV0dXJuIEJhc2ljQXV0aDtcbn0oQXV0aFR5cGUpKTtcbmV4cG9ydHMuQmFzaWNBdXRoID0gQmFzaWNBdXRoO1xudmFyIEN1c3RvbUF1dGggPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhDdXN0b21BdXRoLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEN1c3RvbUF1dGgoKSB7XG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBDdXN0b21BdXRoLnByb3RvdHlwZS5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAoZGF0YSA9PT0gdm9pZCAwKSB7IGRhdGEgPSB7fTsgfVxuICAgICAgICByZXR1cm4gdGhpcy5pbkFwcEJyb3dzZXJGbG93KHsgJ3Byb3ZpZGVyJzogJ2N1c3RvbScgfSwgZGF0YSk7XG4gICAgfTtcbiAgICByZXR1cm4gQ3VzdG9tQXV0aDtcbn0oQXV0aFR5cGUpKTtcbmV4cG9ydHMuQ3VzdG9tQXV0aCA9IEN1c3RvbUF1dGg7XG52YXIgVHdpdHRlckF1dGggPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhUd2l0dGVyQXV0aCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBUd2l0dGVyQXV0aCgpIHtcbiAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIFR3aXR0ZXJBdXRoLnByb3RvdHlwZS5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAoZGF0YSA9PT0gdm9pZCAwKSB7IGRhdGEgPSB7fTsgfVxuICAgICAgICByZXR1cm4gdGhpcy5pbkFwcEJyb3dzZXJGbG93KHsgJ3Byb3ZpZGVyJzogJ3R3aXR0ZXInIH0sIGRhdGEpO1xuICAgIH07XG4gICAgcmV0dXJuIFR3aXR0ZXJBdXRoO1xufShBdXRoVHlwZSkpO1xuZXhwb3J0cy5Ud2l0dGVyQXV0aCA9IFR3aXR0ZXJBdXRoO1xudmFyIEZhY2Vib29rQXV0aCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEZhY2Vib29rQXV0aCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBGYWNlYm9va0F1dGgoKSB7XG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBGYWNlYm9va0F1dGgucHJvdG90eXBlLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhID09PSB2b2lkIDApIHsgZGF0YSA9IHt9OyB9XG4gICAgICAgIHJldHVybiB0aGlzLmluQXBwQnJvd3NlckZsb3coeyAncHJvdmlkZXInOiAnZmFjZWJvb2snIH0sIGRhdGEpO1xuICAgIH07XG4gICAgcmV0dXJuIEZhY2Vib29rQXV0aDtcbn0oQXV0aFR5cGUpKTtcbmV4cG9ydHMuRmFjZWJvb2tBdXRoID0gRmFjZWJvb2tBdXRoO1xudmFyIEdpdGh1YkF1dGggPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhHaXRodWJBdXRoLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEdpdGh1YkF1dGgoKSB7XG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBHaXRodWJBdXRoLnByb3RvdHlwZS5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAoZGF0YSA9PT0gdm9pZCAwKSB7IGRhdGEgPSB7fTsgfVxuICAgICAgICByZXR1cm4gdGhpcy5pbkFwcEJyb3dzZXJGbG93KHsgJ3Byb3ZpZGVyJzogJ2dpdGh1YicgfSwgZGF0YSk7XG4gICAgfTtcbiAgICByZXR1cm4gR2l0aHViQXV0aDtcbn0oQXV0aFR5cGUpKTtcbmV4cG9ydHMuR2l0aHViQXV0aCA9IEdpdGh1YkF1dGg7XG52YXIgR29vZ2xlQXV0aCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEdvb2dsZUF1dGgsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gR29vZ2xlQXV0aCgpIHtcbiAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIEdvb2dsZUF1dGgucHJvdG90eXBlLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhID09PSB2b2lkIDApIHsgZGF0YSA9IHt9OyB9XG4gICAgICAgIHJldHVybiB0aGlzLmluQXBwQnJvd3NlckZsb3coeyAncHJvdmlkZXInOiAnZ29vZ2xlJyB9LCBkYXRhKTtcbiAgICB9O1xuICAgIHJldHVybiBHb29nbGVBdXRoO1xufShBdXRoVHlwZSkpO1xuZXhwb3J0cy5Hb29nbGVBdXRoID0gR29vZ2xlQXV0aDtcbnZhciBJbnN0YWdyYW1BdXRoID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSW5zdGFncmFtQXV0aCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBJbnN0YWdyYW1BdXRoKCkge1xuICAgICAgICBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgSW5zdGFncmFtQXV0aC5wcm90b3R5cGUuYXV0aGVudGljYXRlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgaWYgKGRhdGEgPT09IHZvaWQgMCkgeyBkYXRhID0ge307IH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaW5BcHBCcm93c2VyRmxvdyh7ICdwcm92aWRlcic6ICdpbnN0YWdyYW0nIH0sIGRhdGEpO1xuICAgIH07XG4gICAgcmV0dXJuIEluc3RhZ3JhbUF1dGg7XG59KEF1dGhUeXBlKSk7XG5leHBvcnRzLkluc3RhZ3JhbUF1dGggPSBJbnN0YWdyYW1BdXRoO1xudmFyIExpbmtlZEluQXV0aCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKExpbmtlZEluQXV0aCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBMaW5rZWRJbkF1dGgoKSB7XG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBMaW5rZWRJbkF1dGgucHJvdG90eXBlLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhID09PSB2b2lkIDApIHsgZGF0YSA9IHt9OyB9XG4gICAgICAgIHJldHVybiB0aGlzLmluQXBwQnJvd3NlckZsb3coeyAncHJvdmlkZXInOiAnbGlua2VkaW4nIH0sIGRhdGEpO1xuICAgIH07XG4gICAgcmV0dXJuIExpbmtlZEluQXV0aDtcbn0oQXV0aFR5cGUpKTtcbmV4cG9ydHMuTGlua2VkSW5BdXRoID0gTGlua2VkSW5BdXRoO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcbnZhciBDbGllbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENsaWVudCh0b2tlbkNvbnRleHQsIGJhc2VVcmwsIHJlcSAvLyBUT0RPOiB1c2Ugc3VwZXJhZ2VudCB0eXBlc1xuICAgICAgICApIHtcbiAgICAgICAgdGhpcy50b2tlbkNvbnRleHQgPSB0b2tlbkNvbnRleHQ7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9IGJhc2VVcmw7XG4gICAgICAgIGlmICh0eXBlb2YgcmVxID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmVxID0gcmVxdWVzdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlcSA9IHJlcTtcbiAgICB9XG4gICAgQ2xpZW50LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoZW5kcG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VwcGxlbWVudCh0aGlzLnJlcS5nZXQsIGVuZHBvaW50KTtcbiAgICB9O1xuICAgIENsaWVudC5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChlbmRwb2ludCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBwbGVtZW50KHRoaXMucmVxLnBvc3QsIGVuZHBvaW50KTtcbiAgICB9O1xuICAgIENsaWVudC5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gKGVuZHBvaW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cHBsZW1lbnQodGhpcy5yZXEucHV0LCBlbmRwb2ludCk7XG4gICAgfTtcbiAgICBDbGllbnQucHJvdG90eXBlLnBhdGNoID0gZnVuY3Rpb24gKGVuZHBvaW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cHBsZW1lbnQodGhpcy5yZXEucGF0Y2gsIGVuZHBvaW50KTtcbiAgICB9O1xuICAgIENsaWVudC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKGVuZHBvaW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1cHBsZW1lbnQodGhpcy5yZXEuZGVsZXRlLCBlbmRwb2ludCk7XG4gICAgfTtcbiAgICBDbGllbnQucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAobWV0aG9kLCBlbmRwb2ludCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBwbGVtZW50KHRoaXMucmVxLmJpbmQodGhpcy5yZXEsIG1ldGhvZCksIGVuZHBvaW50KTtcbiAgICB9O1xuICAgIENsaWVudC5wcm90b3R5cGUuc3VwcGxlbWVudCA9IGZ1bmN0aW9uIChmbiwgZW5kcG9pbnQpIHtcbiAgICAgICAgaWYgKGVuZHBvaW50LnN1YnN0cmluZygwLCAxKSAhPT0gJy8nKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignZW5kcG9pbnQgbXVzdCBzdGFydCB3aXRoIGxlYWRpbmcgc2xhc2gnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVxID0gZm4odGhpcy5iYXNlVXJsICsgZW5kcG9pbnQpO1xuICAgICAgICB2YXIgdG9rZW4gPSB0aGlzLnRva2VuQ29udGV4dC5nZXQoKTtcbiAgICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICByZXEuc2V0KCdBdXRob3JpemF0aW9uJywgXCJCZWFyZXIgXCIgKyB0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcTtcbiAgICB9O1xuICAgIHJldHVybiBDbGllbnQ7XG59KCkpO1xuZXhwb3J0cy5DbGllbnQgPSBDbGllbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBDb25maWcgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbmZpZygpIHtcbiAgICAgICAgdGhpcy51cmxzID0ge1xuICAgICAgICAgICAgJ2FwaSc6ICdodHRwczovL2FwaS5pb25pYy5pbydcbiAgICAgICAgfTtcbiAgICB9XG4gICAgQ29uZmlnLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgfTtcbiAgICBDb25maWcucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5nc1tuYW1lXTtcbiAgICB9O1xuICAgIENvbmZpZy5wcm90b3R5cGUuZ2V0VVJMID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIHVybHMgPSB0aGlzLnNldHRpbmdzICYmIHRoaXMuc2V0dGluZ3NbJ3VybHMnXSB8fCB7fTtcbiAgICAgICAgaWYgKHVybHNbbmFtZV0pIHtcbiAgICAgICAgICAgIHJldHVybiB1cmxzW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnVybHNbbmFtZV07XG4gICAgfTtcbiAgICByZXR1cm4gQ29uZmlnO1xufSgpKTtcbmV4cG9ydHMuQ29uZmlnID0gQ29uZmlnO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgQ29yZG92YSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29yZG92YShkZXBzLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuZGV2aWNlID0gZGVwcy5kZXZpY2U7XG4gICAgICAgIHRoaXMuZW1pdHRlciA9IGRlcHMuZW1pdHRlcjtcbiAgICAgICAgdGhpcy5sb2dnZXIgPSBkZXBzLmxvZ2dlcjtcbiAgICB9XG4gICAgQ29yZG92YS5wcm90b3R5cGUuYm9vdHN0cmFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZXZlbnRzID0gWydwYXVzZScsICdyZXN1bWUnXTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW19pIC0gMF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuZW1pdHRlci5lbWl0KCdjb3Jkb3ZhOmRldmljZXJlYWR5JywgeyAnYXJncyc6IGFyZ3MgfSk7XG4gICAgICAgICAgICB2YXIgX2xvb3BfMSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbX2kgLSAwXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZW1pdHRlci5lbWl0KCdjb3Jkb3ZhOicgKyBlLCB7ICdhcmdzJzogYXJncyB9KTtcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZm9yICh2YXIgX2EgPSAwLCBldmVudHNfMSA9IGV2ZW50czsgX2EgPCBldmVudHNfMS5sZW5ndGg7IF9hKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGV2ZW50c18xW19hXTtcbiAgICAgICAgICAgICAgICBfbG9vcF8xKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIHRoaXMubG9hZCgpO1xuICAgIH07XG4gICAgQ29yZG92YS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQXZhaWxhYmxlKCkpIHtcbiAgICAgICAgICAgIHZhciBjb3Jkb3ZhU2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICB2YXIgY29yZG92YVNyYyA9ICdjb3Jkb3ZhLmpzJztcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5kZXZpY2UuZGV2aWNlVHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FuZHJvaWQnOlxuICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIDQpID09PSAnZmlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcmRvdmFTcmMgPSAnZmlsZTovLy9hbmRyb2lkX2Fzc2V0L3d3dy9jb3Jkb3ZhLmpzJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdpcGFkJzpcbiAgICAgICAgICAgICAgICBjYXNlICdpcGhvbmUnOlxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc291cmNlID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5tYXRjaCgvY29yZG92YV9qc19ib290c3RyYXBfcmVzb3VyY2U9KC4qPykoJnwjfCQpL2kpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29yZG92YVNyYyA9IGRlY29kZVVSSShyZXNvdXJjZVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0lvbmljIENvcmRvdmE6IGNvdWxkIG5vdCBmaW5kIGNvcmRvdmFfanNfYm9vdHN0cmFwX3Jlc291cmNlIHF1ZXJ5IHBhcmFtJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnSW9uaWMgQ29yZG92YTonLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvcmRvdmFTY3JpcHQuc2V0QXR0cmlidXRlKCdzcmMnLCBjb3Jkb3ZhU3JjKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoY29yZG92YVNjcmlwdCk7XG4gICAgICAgICAgICBpZiAodGhpcy5sb2dnZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdJb25pYyBDb3Jkb3ZhOiBpbmplY3RpbmcgY29yZG92YS5qcycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBDb3Jkb3ZhLnByb3RvdHlwZS5pc0F2YWlsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMubG9nZ2VyKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdJb25pYyBDb3Jkb3ZhOiBzZWFyY2hpbmcgZm9yIGNvcmRvdmEuanMnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGNvcmRvdmEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sb2dnZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdJb25pYyBDb3Jkb3ZhOiBjb3Jkb3ZhLmpzIGhhcyBhbHJlYWR5IGJlZW4gbG9hZGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcbiAgICAgICAgdmFyIGxlbiA9IHNjcmlwdHMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXS5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICAgICAgaWYgKHNjcmlwdCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IHNjcmlwdC5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0c0xlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcGFydHNMZW5ndGggPSBwYXJ0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJ0c1twYXJ0c0xlbmd0aCAtIDFdID09PSAnY29yZG92YS5qcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0lvbmljIENvcmRvdmE6IGNvcmRvdmEuanMgaGFzIHByZXZpb3VzbHkgYmVlbiBpbmNsdWRlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnSW9uaWMgQ29yZG92YTogZW5jb3VudGVyZWQgZXJyb3Igd2hpbGUgdGVzdGluZyBmb3IgY29yZG92YS5qcyBwcmVzZW5jZSwgJyArIGUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIENvcmRvdmE7XG59KCkpO1xuZXhwb3J0cy5Db3Jkb3ZhID0gQ29yZG92YTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIENvcmUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvcmUoZGVwcywgY2ZnKSB7XG4gICAgICAgIHRoaXMuY2ZnID0gY2ZnO1xuICAgICAgICB0aGlzLl92ZXJzaW9uID0gJzAuOC4wLWJldGEuMTInO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGRlcHMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGRlcHMubG9nZ2VyO1xuICAgICAgICB0aGlzLmVtaXR0ZXIgPSBkZXBzLmVtaXR0ZXI7XG4gICAgICAgIHRoaXMuaW5zaWdodHMgPSBkZXBzLmluc2lnaHRzO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyRXZlbnRIYW5kbGVycygpO1xuICAgICAgICB0aGlzLmluc2lnaHRzLnRyYWNrKCdtb2JpbGVhcHAub3BlbmVkJyk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb3JlLnByb3RvdHlwZSwgXCJ2ZXJzaW9uXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmVyc2lvbjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgQ29yZS5wcm90b3R5cGUucmVnaXN0ZXJFdmVudEhhbmRsZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLmVtaXR0ZXIub24oJ2NvcmRvdmE6cmVzdW1lJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIF90aGlzLmluc2lnaHRzLnRyYWNrKCdtb2JpbGVhcHAub3BlbmVkJyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVtaXR0ZXIub24oJ3B1c2g6bm90aWZpY2F0aW9uJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2UuYXBwLmFzbGVlcCB8fCBkYXRhLm1lc3NhZ2UuYXBwLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmluc2lnaHRzLnRyYWNrKCdtb2JpbGVhcHAub3BlbmVkLnB1c2gnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29yZTtcbn0oKSk7XG5leHBvcnRzLkNvcmUgPSBDb3JlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcHJvbWlzZV8xID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpO1xudmFyIE5PX1BMVUdJTiA9IG5ldyBFcnJvcignTWlzc2luZyBkZXBsb3kgcGx1Z2luOiBgaW9uaWMtcGx1Z2luLWRlcGxveWAnKTtcbnZhciBJTklUSUFMX0RFTEFZID0gMSAqIDUgKiAxMDAwO1xudmFyIFdBVENIX0lOVEVSVkFMID0gMSAqIDYwICogMTAwMDtcbnZhciBEZXBsb3kgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERlcGxveShkZXBzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHRoaXMuX2NoYW5uZWxUYWcgPSAncHJvZHVjdGlvbic7XG4gICAgICAgIHRoaXMuY29uZmlnID0gZGVwcy5jb25maWc7XG4gICAgICAgIHRoaXMuZW1pdHRlciA9IGRlcHMuZW1pdHRlcjtcbiAgICAgICAgdGhpcy5sb2dnZXIgPSBkZXBzLmxvZ2dlcjtcbiAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RldmljZTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5fZ2V0UGx1Z2luKCkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fcGx1Z2luLmluaXQoX3RoaXMuY29uZmlnLmdldCgnYXBwX2lkJyksIF90aGlzLmNvbmZpZy5nZXRVUkwoJ2FwaScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmVtaXR0ZXIuZW1pdCgnZGVwbG95OnJlYWR5Jyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBGZXRjaCB0aGUgRGVwbG95IFBsdWdpblxuICAgICAqXG4gICAgICogSWYgdGhlIHBsdWdpbiBoYXMgbm90IGJlZW4gc2V0IHlldCwgYXR0ZW1wdCB0byBmZXRjaCBpdCwgb3RoZXJ3aXNlIGxvZ1xuICAgICAqIGEgbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0lvbmljRGVwbG95fSBSZXR1cm5zIHRoZSBwbHVnaW4gb3IgZmFsc2VcbiAgICAgKi9cbiAgICBEZXBsb3kucHJvdG90eXBlLl9nZXRQbHVnaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LklvbmljRGVwbG95ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybignSW9uaWMgRGVwbG95OiBEaXNhYmxlZCEgRGVwbG95IHBsdWdpbiBpcyBub3QgaW5zdGFsbGVkIG9yIGhhcyBub3QgbG9hZGVkLiBIYXZlIHlvdSBydW4gYGlvbmljIHBsdWdpbiBhZGQgaW9uaWMtcGx1Z2luLWRlcGxveWAgeWV0PycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fcGx1Z2luKSB7XG4gICAgICAgICAgICB0aGlzLl9wbHVnaW4gPSB3aW5kb3cuSW9uaWNEZXBsb3k7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3BsdWdpbjtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENoZWNrIGZvciB1cGRhdGVzXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBXaWxsIHJlc29sdmUgd2l0aCB0cnVlIGlmIGFuIHVwZGF0ZSBpcyBhdmFpbGFibGUsIGZhbHNlIG90aGVyd2lzZS4gQSBzdHJpbmcgb3JcbiAgICAgKiAgIGVycm9yIHdpbGwgYmUgcGFzc2VkIHRvIHJlamVjdCgpIGluIHRoZSBldmVudCBvZiBhIGZhaWx1cmUuXG4gICAgICovXG4gICAgRGVwbG95LnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTtcbiAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RlcGxveTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5fZ2V0UGx1Z2luKCkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fcGx1Z2luLmNoZWNrKF90aGlzLmNvbmZpZy5nZXQoJ2FwcF9pZCcpLCBfdGhpcy5fY2hhbm5lbFRhZywgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdCA9PT0gJ3RydWUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5sb2dnZXIuaW5mbygnSW9uaWMgRGVwbG95OiBhbiB1cGRhdGUgaXMgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMubG9nZ2VyLmluZm8oJ0lvbmljIERlcGxveTogbm8gdXBkYXRlcyBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmxvZ2dlci5lcnJvcignSW9uaWMgRGVwbG95OiBlbmNvdW50ZXJlZCBhbiBlcnJvciB3aGlsZSBjaGVja2luZyBmb3IgdXBkYXRlcycpO1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KE5PX1BMVUdJTik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIERvd25sb2FkIGFuZCBhdmFpbGFibGUgdXBkYXRlXG4gICAgICpcbiAgICAgKiBUaGlzIHNob3VsZCBiZSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggZXh0cmFjdCgpXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gVGhlIHByb21pc2Ugd2hpY2ggd2lsbCByZXNvbHZlIHdpdGggdHJ1ZS9mYWxzZS5cbiAgICAgKi9cbiAgICBEZXBsb3kucHJvdG90eXBlLmRvd25sb2FkID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTtcbiAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RlcGxveTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5fZ2V0UGx1Z2luKCkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fcGx1Z2luLmRvd25sb2FkKF90aGlzLmNvbmZpZy5nZXQoJ2FwcF9pZCcpLCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09ICd0cnVlJyAmJiByZXN1bHQgIT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm9uUHJvZ3Jlc3MocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmxvZ2dlci5pbmZvKCdJb25pYyBEZXBsb3k6IGRvd25sb2FkIGNvbXBsZXRlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3VsdCA9PT0gJ3RydWUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KE5PX1BMVUdJTik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgdGhlIGxhc3QgZG93bmxvYWRlZCB1cGRhdGVcbiAgICAgKlxuICAgICAqIFRoaXMgc2hvdWxkIGJlIGNhbGxlZCBhZnRlciBhIGRvd25sb2FkKCkgc3VjY2Vzc2Z1bGx5IHJlc29sdmVzLlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFRoZSBwcm9taXNlIHdoaWNoIHdpbGwgcmVzb2x2ZSB3aXRoIHRydWUvZmFsc2UuXG4gICAgICovXG4gICAgRGVwbG95LnByb3RvdHlwZS5leHRyYWN0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTtcbiAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RlcGxveTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5fZ2V0UGx1Z2luKCkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fcGx1Z2luLmV4dHJhY3QoX3RoaXMuY29uZmlnLmdldCgnYXBwX2lkJyksIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gJ2RvbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5vblByb2dyZXNzKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5sb2dnZXIuaW5mbygnSW9uaWMgRGVwbG95OiBleHRyYWN0aW9uIGNvbXBsZXRlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3VsdCA9PT0gJ3RydWUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KE5PX1BMVUdJTik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIExvYWQgdGhlIGxhdGVzdCBkZXBsb3llZCB2ZXJzaW9uXG4gICAgICogVGhpcyBpcyBvbmx5IG5lY2Vzc2FyeSB0byBjYWxsIGlmIHlvdSBoYXZlIG1hbnVhbGx5IGRvd25sb2FkZWQgYW5kIGV4dHJhY3RlZFxuICAgICAqIGFuIHVwZGF0ZSBhbmQgd2lzaCB0byByZWxvYWQgdGhlIGFwcCB3aXRoIHRoZSBsYXRlc3QgZGVwbG95LiBUaGUgbGF0ZXN0IGRlcGxveVxuICAgICAqIHdpbGwgYXV0b21hdGljYWxseSBiZSBsb2FkZWQgd2hlbiB0aGUgYXBwIGlzIHN0YXJ0ZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAqL1xuICAgIERlcGxveS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RlcGxveTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5fZ2V0UGx1Z2luKCkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fcGx1Z2luLnJlZGlyZWN0KF90aGlzLmNvbmZpZy5nZXQoJ2FwcF9pZCcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBXYXRjaCBjb25zdGFudGx5IGNoZWNrcyBmb3IgdXBkYXRlcywgYW5kIHRyaWdnZXJzIGFuIGV2ZW50IHdoZW4gb25lIGlzIHJlYWR5LlxuICAgICAqL1xuICAgIERlcGxveS5wcm90b3R5cGUud2F0Y2ggPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICghb3B0aW9ucy5pbml0aWFsRGVsYXkpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuaW5pdGlhbERlbGF5ID0gSU5JVElBTF9ERUxBWTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMuaW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuaW50ZXJ2YWwgPSBXQVRDSF9JTlRFUlZBTDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjaGVja0ZvclVwZGF0ZXMoKSB7XG4gICAgICAgICAgICBzZWxmLmNoZWNrKCkudGhlbihmdW5jdGlvbiAoaGFzVXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc1VwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmVtaXR0ZXIuZW1pdCgnZGVwbG95OnVwZGF0ZS1yZWFkeScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmxvZ2dlci5pbmZvKCdJb25pYyBEZXBsb3k6IHVuYWJsZSB0byBjaGVjayBmb3IgdXBkYXRlczogJyArIGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIENoZWNrIG91ciB0aW1lb3V0IHRvIG1ha2Ugc3VyZSBpdCB3YXNuJ3QgY2xlYXJlZCB3aGlsZSB3ZSB3ZXJlIHdhaXRpbmdcbiAgICAgICAgICAgIC8vIGZvciBhIHNlcnZlciByZXNwb25zZVxuICAgICAgICAgICAgaWYgKHRoaXMuX2NoZWNrVGltZW91dCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NoZWNrVGltZW91dCA9IHNldFRpbWVvdXQoY2hlY2tGb3JVcGRhdGVzLmJpbmQoc2VsZiksIG9wdGlvbnMuaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIGFmdGVyIGFuIGluaXRpYWwgc2hvcnQgZGVwbGF5XG4gICAgICAgIHRoaXMuX2NoZWNrVGltZW91dCA9IHNldFRpbWVvdXQoY2hlY2tGb3JVcGRhdGVzLmJpbmQoc2VsZiksIG9wdGlvbnMuaW5pdGlhbERlbGF5KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFN0b3AgYXV0b21hdGljYWxseSBsb29raW5nIGZvciB1cGRhdGVzXG4gICAgICovXG4gICAgRGVwbG95LnByb3RvdHlwZS51bndhdGNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fY2hlY2tUaW1lb3V0KTtcbiAgICAgICAgdGhpcy5fY2hlY2tUaW1lb3V0ID0gbnVsbDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IGRlcGxveVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gVGhlIHJlc29sdmVyIHdpbGwgYmUgcGFzc2VkIGFuIG9iamVjdCB0aGF0IGhhcyBrZXkvdmFsdWVcbiAgICAgKiAgICBwYWlycyBwZXJ0YWluaW5nIHRvIHRoZSBjdXJyZW50bHkgZGVwbG95ZWQgdXBkYXRlLlxuICAgICAqL1xuICAgIERlcGxveS5wcm90b3R5cGUuaW5mbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTsgLy8gVE9ET1xuICAgICAgICB0aGlzLmVtaXR0ZXIub25jZSgnZGVwbG95OnJlYWR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLl9nZXRQbHVnaW4oKSkge1xuICAgICAgICAgICAgICAgIF90aGlzLl9wbHVnaW4uaW5mbyhfdGhpcy5jb25maWcuZ2V0KCdhcHBfaWQnKSwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChOT19QTFVHSU4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBMaXN0IHRoZSBEZXBsb3kgdmVyc2lvbnMgdGhhdCBoYXZlIGJlZW4gaW5zdGFsbGVkIG9uIHRoaXMgZGV2aWNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBUaGUgcmVzb2x2ZXIgd2lsbCBiZSBwYXNzZWQgYW4gYXJyYXkgb2YgZGVwbG95IHV1aWRzXG4gICAgICovXG4gICAgRGVwbG95LnByb3RvdHlwZS5nZXRWZXJzaW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTsgLy8gVE9ET1xuICAgICAgICB0aGlzLmVtaXR0ZXIub25jZSgnZGVwbG95OnJlYWR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLl9nZXRQbHVnaW4oKSkge1xuICAgICAgICAgICAgICAgIF90aGlzLl9wbHVnaW4uZ2V0VmVyc2lvbnMoX3RoaXMuY29uZmlnLmdldCgnYXBwX2lkJyksIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoTk9fUExVR0lOKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFuIGluc3RhbGxlZCBkZXBsb3kgb24gdGhpcyBkZXZpY2VcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1dWlkIFRoZSBkZXBsb3kgdXVpZCB5b3Ugd2lzaCB0byByZW1vdmUgZnJvbSB0aGUgZGV2aWNlXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gU3RhbmRhcmQgcmVzb2x2ZS9yZWplY3QgcmVzb2x1dGlvblxuICAgICAqL1xuICAgIERlcGxveS5wcm90b3R5cGUuZGVsZXRlVmVyc2lvbiA9IGZ1bmN0aW9uICh1dWlkKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBwcm9taXNlXzEuRGVmZXJyZWRQcm9taXNlKCk7IC8vIFRPRE9cbiAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RlcGxveTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5fZ2V0UGx1Z2luKCkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fcGx1Z2luLmRlbGV0ZVZlcnNpb24oX3RoaXMuY29uZmlnLmdldCgnYXBwX2lkJyksIHV1aWQsIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoTk9fUExVR0lOKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgbWV0YWRhdGEgZm9yIGEgZ2l2ZW4gZGVwbG95IHV1aWQuIElmIG5vIHV1aWQgaXMgZ2l2ZW4sIGl0IHdpbGwgYXR0ZW1wdFxuICAgICAqIHRvIGdyYWIgdGhlIG1ldGFkYXRhIGZvciB0aGUgbW9zdCByZWNlbnRseSBrbm93biB1cGRhdGUgdmVyc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1dWlkIFRoZSBkZXBsb3kgdXVpZCB5b3Ugd2lzaCB0byBncmFiIG1ldGFkYXRhIGZvciwgY2FuIGJlIGxlZnQgYmxhbmsgdG8gZ3JhYiBsYXRlc3Qga25vd24gdXBkYXRlIG1ldGFkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gU3RhbmRhcmQgcmVzb2x2ZS9yZWplY3QgcmVzb2x1dGlvblxuICAgICAqL1xuICAgIERlcGxveS5wcm90b3R5cGUuZ2V0TWV0YWRhdGEgPSBmdW5jdGlvbiAodXVpZCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBuZXcgcHJvbWlzZV8xLkRlZmVycmVkUHJvbWlzZSgpOyAvLyBUT0RPXG4gICAgICAgIHRoaXMuZW1pdHRlci5vbmNlKCdkZXBsb3k6cmVhZHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMuX2dldFBsdWdpbigpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX3BsdWdpbi5nZXRNZXRhZGF0YShfdGhpcy5jb25maWcuZ2V0KCdhcHBfaWQnKSwgdXVpZCwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3VsdC5tZXRhZGF0YSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChOT19QTFVHSU4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGRlcGxveSBjaGFubmVsIHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQgZm9yIHVwZGF0c2VcbiAgICAgKiBTZWUgaHR0cDovL2RvY3MuaW9uaWMuaW8vZG9jcy9kZXBsb3ktY2hhbm5lbHMgZm9yIG1vcmUgaW5mb3JtYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFubmVsVGFnIFRoZSBjaGFubmVsIHRhZyB0byB1c2VcbiAgICAgKi9cbiAgICBEZXBsb3kucHJvdG90eXBlLnNldENoYW5uZWwgPSBmdW5jdGlvbiAoY2hhbm5lbFRhZykge1xuICAgICAgICB0aGlzLl9jaGFubmVsVGFnID0gY2hhbm5lbFRhZztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhcHAgd2l0aCB0aGUgbGF0ZXN0IGRlcGxveVxuICAgICAqL1xuICAgIERlcGxveS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTtcbiAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RlcGxveTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5fZ2V0UGx1Z2luKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3IgdXBkYXRlc1xuICAgICAgICAgICAgICAgIF90aGlzLmNoZWNrKCkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGFyZSB1cGRhdGVzLCBkb3dubG9hZCB0aGVtXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZG93bmxvYWRQcm9ncmVzc18xID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRvd25sb2FkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnb25Qcm9ncmVzcyc6IGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvd25sb2FkUHJvZ3Jlc3NfMSA9IHAgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm9uUHJvZ3Jlc3MoZG93bmxvYWRQcm9ncmVzc18xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChuZXcgRXJyb3IoJ0Vycm9yIHdoaWxlIGRvd25sb2FkaW5nJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5leHRyYWN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ29uUHJvZ3Jlc3MnOiBmdW5jdGlvbiAocCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMub25Qcm9ncmVzcyhkb3dubG9hZFByb2dyZXNzXzEgKyBwIC8gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChuZXcgRXJyb3IoJ0Vycm9yIHdoaWxlIGV4dHJhY3RpbmcnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmRlZmVyTG9hZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9wbHVnaW4ucmVkaXJlY3QoX3RoaXMuY29uZmlnLmdldCgnYXBwX2lkJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChOT19QTFVHSU4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgICByZXR1cm4gRGVwbG95O1xufSgpKTtcbmV4cG9ydHMuRGVwbG95ID0gRGVwbG95O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRGV2aWNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEZXZpY2UoZGVwcykge1xuICAgICAgICB0aGlzLmRlcHMgPSBkZXBzO1xuICAgICAgICB0aGlzLmVtaXR0ZXIgPSB0aGlzLmRlcHMuZW1pdHRlcjtcbiAgICAgICAgdGhpcy5kZXZpY2VUeXBlID0gdGhpcy5kZXRlcm1pbmVEZXZpY2VUeXBlKCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJFdmVudEhhbmRsZXJzKCk7XG4gICAgfVxuICAgIERldmljZS5wcm90b3R5cGUucmVnaXN0ZXJFdmVudEhhbmRsZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5kZXZpY2VUeXBlID09PSAndW5rbm93bicpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkZXZpY2U6cmVhZHknKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5vbmNlKCdjb3Jkb3ZhOmRldmljZXJlYWR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmVtaXR0ZXIuZW1pdCgnZGV2aWNlOnJlYWR5Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGRldmljZSBpcyBhbiBBbmRyb2lkIGRldmljZVxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgQW5kcm9pZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgRGV2aWNlLnByb3RvdHlwZS5pc0FuZHJvaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRldmljZVR5cGUgPT09ICdhbmRyb2lkJztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBkZXZpY2UgaXMgYW4gaU9TIGRldmljZVxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgaU9TLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBEZXZpY2UucHJvdG90eXBlLmlzSU9TID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXZpY2VUeXBlID09PSAnaXBob25lJyB8fCB0aGlzLmRldmljZVR5cGUgPT09ICdpcGFkJztcbiAgICB9O1xuICAgIERldmljZS5wcm90b3R5cGUuaXNDb25uZWN0ZWRUb05ldHdvcmsgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICBpZiAodHlwZW9mIG5hdmlnYXRvci5jb25uZWN0aW9uID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICAgICAgdHlwZW9mIG5hdmlnYXRvci5jb25uZWN0aW9uLnR5cGUgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICB0eXBlb2YgQ29ubmVjdGlvbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5zdHJpY3RNb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChuYXZpZ2F0b3IuY29ubmVjdGlvbi50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIENvbm5lY3Rpb24uRVRIRVJORVQ6XG4gICAgICAgICAgICBjYXNlIENvbm5lY3Rpb24uV0lGSTpcbiAgICAgICAgICAgIGNhc2UgQ29ubmVjdGlvbi5DRUxMXzJHOlxuICAgICAgICAgICAgY2FzZSBDb25uZWN0aW9uLkNFTExfM0c6XG4gICAgICAgICAgICBjYXNlIENvbm5lY3Rpb24uQ0VMTF80RzpcbiAgICAgICAgICAgIGNhc2UgQ29ubmVjdGlvbi5DRUxMOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIERldGVybWluZSB0aGUgZGV2aWNlIHR5cGUgdmlhIHRoZSB1c2VyIGFnZW50IHN0cmluZ1xuICAgICAqIEByZXR1cm4ge3N0cmluZ30gbmFtZSBvZiBkZXZpY2UgcGxhdGZvcm0gb3IgJ3Vua25vd24nIGlmIHVuYWJsZSB0byBpZGVudGlmeSB0aGUgZGV2aWNlXG4gICAgICovXG4gICAgRGV2aWNlLnByb3RvdHlwZS5kZXRlcm1pbmVEZXZpY2VUeXBlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50O1xuICAgICAgICB2YXIgaXBhZCA9IGFnZW50Lm1hdGNoKC9pUGFkL2kpO1xuICAgICAgICBpZiAoaXBhZCAmJiAoaXBhZFswXS50b0xvd2VyQ2FzZSgpID09PSAnaXBhZCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2lwYWQnO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpcGhvbmUgPSBhZ2VudC5tYXRjaCgvaVBob25lL2kpO1xuICAgICAgICBpZiAoaXBob25lICYmIChpcGhvbmVbMF0udG9Mb3dlckNhc2UoKSA9PT0gJ2lwaG9uZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2lwaG9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFuZHJvaWQgPSBhZ2VudC5tYXRjaCgvQW5kcm9pZC9pKTtcbiAgICAgICAgaWYgKGFuZHJvaWQgJiYgKGFuZHJvaWRbMF0udG9Mb3dlckNhc2UoKSA9PT0gJ2FuZHJvaWQnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdhbmRyb2lkJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3Vua25vd24nO1xuICAgIH07XG4gICAgcmV0dXJuIERldmljZTtcbn0oKSk7XG5leHBvcnRzLkRldmljZSA9IERldmljZTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbnZhciBhdXRoXzEgPSByZXF1aXJlKCcuL2F1dGgnKTtcbnZhciBhcHBfMSA9IHJlcXVpcmUoJy4vYXBwJyk7XG52YXIgY2xpZW50XzEgPSByZXF1aXJlKCcuL2NsaWVudCcpO1xudmFyIGNvbmZpZ18xID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciBjb3Jkb3ZhXzEgPSByZXF1aXJlKCcuL2NvcmRvdmEnKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKCcuL2NvcmUnKTtcbnZhciBkZXBsb3lfMSA9IHJlcXVpcmUoJy4vZGVwbG95L2RlcGxveScpO1xudmFyIGRldmljZV8xID0gcmVxdWlyZSgnLi9kZXZpY2UnKTtcbnZhciBldmVudHNfMSA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgaW5zaWdodHNfMSA9IHJlcXVpcmUoJy4vaW5zaWdodHMnKTtcbnZhciBsb2dnZXJfMSA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XG52YXIgcHVzaF8xID0gcmVxdWlyZSgnLi9wdXNoL3B1c2gnKTtcbnZhciBzdG9yYWdlXzEgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcbnZhciB1c2VyXzEgPSByZXF1aXJlKCcuL3VzZXIvdXNlcicpO1xudmFyIG1vZHVsZXMgPSB7fTtcbmZ1bmN0aW9uIGNhY2hlKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpIHtcbiAgICB2YXIgbWV0aG9kID0gZGVzY3JpcHRvci5nZXQ7XG4gICAgZGVzY3JpcHRvci5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlc1twcm9wZXJ0eUtleV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIG1vZHVsZXNbcHJvcGVydHlLZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1vZHVsZXNbcHJvcGVydHlLZXldO1xuICAgIH07XG4gICAgZGVzY3JpcHRvci5zZXQgPSBmdW5jdGlvbiAodmFsdWUpIHsgfTtcbn1cbnZhciBDb250YWluZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbnRhaW5lcigpIHtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbnRhaW5lci5wcm90b3R5cGUsIFwiY29uZmlnXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGNvbmZpZ18xLkNvbmZpZygpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29udGFpbmVyLnByb3RvdHlwZSwgXCJldmVudEVtaXR0ZXJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZXZlbnRzXzEuRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcImxvZ2dlclwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBsb2dnZXJfMS5Mb2dnZXIoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbnRhaW5lci5wcm90b3R5cGUsIFwiYXBwXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29uZmlnID0gdGhpcy5jb25maWc7XG4gICAgICAgICAgICB2YXIgYXBwID0gbmV3IGFwcF8xLkFwcChjb25maWcuZ2V0KCdhcHBfaWQnKSk7XG4gICAgICAgICAgICBhcHAuZ2NtS2V5ID0gY29uZmlnLmdldCgnZ2NtX2tleScpO1xuICAgICAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbnRhaW5lci5wcm90b3R5cGUsIFwibG9jYWxTdG9yYWdlU3RyYXRlZ3lcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgc3RvcmFnZV8xLkxvY2FsU3RvcmFnZVN0cmF0ZWd5KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcInNlc3Npb25TdG9yYWdlU3RyYXRlZ3lcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgc3RvcmFnZV8xLlNlc3Npb25TdG9yYWdlU3RyYXRlZ3koKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbnRhaW5lci5wcm90b3R5cGUsIFwiYXV0aFRva2VuQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gJ2lvbmljX2lvX2F1dGhfJyArIHRoaXMuY29uZmlnLmdldCgnYXBwX2lkJyk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGF1dGhfMS5Db21iaW5lZEF1dGhUb2tlbkNvbnRleHQoeyAnc3RvcmFnZSc6IHRoaXMubG9jYWxTdG9yYWdlU3RyYXRlZ3ksICd0ZW1wU3RvcmFnZSc6IHRoaXMuc2Vzc2lvblN0b3JhZ2VTdHJhdGVneSB9LCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcImNsaWVudFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBjbGllbnRfMS5DbGllbnQodGhpcy5hdXRoVG9rZW5Db250ZXh0LCB0aGlzLmNvbmZpZy5nZXRVUkwoJ2FwaScpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbnRhaW5lci5wcm90b3R5cGUsIFwiaW5zaWdodHNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgaW5zaWdodHNfMS5JbnNpZ2h0cyh7ICdhcHAnOiB0aGlzLmFwcCwgJ2NsaWVudCc6IHRoaXMuY2xpZW50LCAnbG9nZ2VyJzogdGhpcy5sb2dnZXIgfSwgeyAnaW50ZXJ2YWxTdWJtaXQnOiA2MCAqIDEwMDAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcImNvcmVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgY29yZV8xLkNvcmUoeyAnY29uZmlnJzogdGhpcy5jb25maWcsICdsb2dnZXInOiB0aGlzLmxvZ2dlciwgJ2VtaXR0ZXInOiB0aGlzLmV2ZW50RW1pdHRlciwgJ2luc2lnaHRzJzogdGhpcy5pbnNpZ2h0cyB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbnRhaW5lci5wcm90b3R5cGUsIFwiZGV2aWNlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRldmljZV8xLkRldmljZSh7ICdlbWl0dGVyJzogdGhpcy5ldmVudEVtaXR0ZXIgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcImNvcmRvdmFcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgY29yZG92YV8xLkNvcmRvdmEoeyAnZGV2aWNlJzogdGhpcy5kZXZpY2UsICdlbWl0dGVyJzogdGhpcy5ldmVudEVtaXR0ZXIsICdsb2dnZXInOiB0aGlzLmxvZ2dlciB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbnRhaW5lci5wcm90b3R5cGUsIFwic3RvcmFnZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBzdG9yYWdlXzEuU3RvcmFnZSh7ICdzdHJhdGVneSc6IHRoaXMubG9jYWxTdG9yYWdlU3RyYXRlZ3kgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcInVzZXJDb250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHVzZXJfMS5Vc2VyQ29udGV4dCh7ICdzdG9yYWdlJzogdGhpcy5zdG9yYWdlLCAnY29uZmlnJzogdGhpcy5jb25maWcgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcInNpbmdsZVVzZXJTZXJ2aWNlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHVzZXJfMS5TaW5nbGVVc2VyU2VydmljZSh7ICdjbGllbnQnOiB0aGlzLmNsaWVudCwgJ2NvbnRleHQnOiB0aGlzLnVzZXJDb250ZXh0IH0pO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29udGFpbmVyLnByb3RvdHlwZSwgXCJhdXRoTW9kdWxlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAnYmFzaWMnOiBuZXcgYXV0aF8xLkJhc2ljQXV0aCh7ICdjb25maWcnOiB0aGlzLmNvbmZpZywgJ2NsaWVudCc6IHRoaXMuY2xpZW50IH0pLFxuICAgICAgICAgICAgICAgICdjdXN0b20nOiBuZXcgYXV0aF8xLkN1c3RvbUF1dGgoeyAnY29uZmlnJzogdGhpcy5jb25maWcsICdjbGllbnQnOiB0aGlzLmNsaWVudCB9KSxcbiAgICAgICAgICAgICAgICAndHdpdHRlcic6IG5ldyBhdXRoXzEuVHdpdHRlckF1dGgoeyAnY29uZmlnJzogdGhpcy5jb25maWcsICdjbGllbnQnOiB0aGlzLmNsaWVudCB9KSxcbiAgICAgICAgICAgICAgICAnZmFjZWJvb2snOiBuZXcgYXV0aF8xLkZhY2Vib29rQXV0aCh7ICdjb25maWcnOiB0aGlzLmNvbmZpZywgJ2NsaWVudCc6IHRoaXMuY2xpZW50IH0pLFxuICAgICAgICAgICAgICAgICdnaXRodWInOiBuZXcgYXV0aF8xLkdpdGh1YkF1dGgoeyAnY29uZmlnJzogdGhpcy5jb25maWcsICdjbGllbnQnOiB0aGlzLmNsaWVudCB9KSxcbiAgICAgICAgICAgICAgICAnZ29vZ2xlJzogbmV3IGF1dGhfMS5Hb29nbGVBdXRoKHsgJ2NvbmZpZyc6IHRoaXMuY29uZmlnLCAnY2xpZW50JzogdGhpcy5jbGllbnQgfSksXG4gICAgICAgICAgICAgICAgJ2luc3RhZ3JhbSc6IG5ldyBhdXRoXzEuSW5zdGFncmFtQXV0aCh7ICdjb25maWcnOiB0aGlzLmNvbmZpZywgJ2NsaWVudCc6IHRoaXMuY2xpZW50IH0pLFxuICAgICAgICAgICAgICAgICdsaW5rZWRpbic6IG5ldyBhdXRoXzEuTGlua2VkSW5BdXRoKHsgJ2NvbmZpZyc6IHRoaXMuY29uZmlnLCAnY2xpZW50JzogdGhpcy5jbGllbnQgfSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcImF1dGhcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgYXV0aF8xLkF1dGgoe1xuICAgICAgICAgICAgICAgICdlbWl0dGVyJzogdGhpcy5ldmVudEVtaXR0ZXIsXG4gICAgICAgICAgICAgICAgJ2F1dGhNb2R1bGVzJzogdGhpcy5hdXRoTW9kdWxlcyxcbiAgICAgICAgICAgICAgICAndG9rZW5Db250ZXh0JzogdGhpcy5hdXRoVG9rZW5Db250ZXh0LFxuICAgICAgICAgICAgICAgICd1c2VyU2VydmljZSc6IHRoaXMuc2luZ2xlVXNlclNlcnZpY2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29udGFpbmVyLnByb3RvdHlwZSwgXCJwdXNoXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHB1c2hfMS5QdXNoKHtcbiAgICAgICAgICAgICAgICAnY29uZmlnJzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgJ2FwcCc6IHRoaXMuYXBwLFxuICAgICAgICAgICAgICAgICdhdXRoJzogdGhpcy5hdXRoLFxuICAgICAgICAgICAgICAgICd1c2VyU2VydmljZSc6IHRoaXMuc2luZ2xlVXNlclNlcnZpY2UsXG4gICAgICAgICAgICAgICAgJ2RldmljZSc6IHRoaXMuZGV2aWNlLFxuICAgICAgICAgICAgICAgICdjbGllbnQnOiB0aGlzLmNsaWVudCxcbiAgICAgICAgICAgICAgICAnZW1pdHRlcic6IHRoaXMuZXZlbnRFbWl0dGVyLFxuICAgICAgICAgICAgICAgICdzdG9yYWdlJzogdGhpcy5zdG9yYWdlLFxuICAgICAgICAgICAgICAgICdsb2dnZXInOiB0aGlzLmxvZ2dlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb250YWluZXIucHJvdG90eXBlLCBcImRlcGxveVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkZXBsb3lfMS5EZXBsb3koe1xuICAgICAgICAgICAgICAgICdjb25maWcnOiB0aGlzLmNvbmZpZyxcbiAgICAgICAgICAgICAgICAnZW1pdHRlcic6IHRoaXMuZXZlbnRFbWl0dGVyLFxuICAgICAgICAgICAgICAgICdsb2dnZXInOiB0aGlzLmxvZ2dlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwiY29uZmlnXCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwiZXZlbnRFbWl0dGVyXCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwibG9nZ2VyXCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwiYXBwXCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwibG9jYWxTdG9yYWdlU3RyYXRlZ3lcIiwgbnVsbCk7XG4gICAgX19kZWNvcmF0ZShbXG4gICAgICAgIGNhY2hlLCBcbiAgICAgICAgX19tZXRhZGF0YSgnZGVzaWduOnR5cGUnLCBPYmplY3QpXG4gICAgXSwgQ29udGFpbmVyLnByb3RvdHlwZSwgXCJzZXNzaW9uU3RvcmFnZVN0cmF0ZWd5XCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwiYXV0aFRva2VuQ29udGV4dFwiLCBudWxsKTtcbiAgICBfX2RlY29yYXRlKFtcbiAgICAgICAgY2FjaGUsIFxuICAgICAgICBfX21ldGFkYXRhKCdkZXNpZ246dHlwZScsIE9iamVjdClcbiAgICBdLCBDb250YWluZXIucHJvdG90eXBlLCBcImNsaWVudFwiLCBudWxsKTtcbiAgICBfX2RlY29yYXRlKFtcbiAgICAgICAgY2FjaGUsIFxuICAgICAgICBfX21ldGFkYXRhKCdkZXNpZ246dHlwZScsIE9iamVjdClcbiAgICBdLCBDb250YWluZXIucHJvdG90eXBlLCBcImluc2lnaHRzXCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwiY29yZVwiLCBudWxsKTtcbiAgICBfX2RlY29yYXRlKFtcbiAgICAgICAgY2FjaGUsIFxuICAgICAgICBfX21ldGFkYXRhKCdkZXNpZ246dHlwZScsIE9iamVjdClcbiAgICBdLCBDb250YWluZXIucHJvdG90eXBlLCBcImRldmljZVwiLCBudWxsKTtcbiAgICBfX2RlY29yYXRlKFtcbiAgICAgICAgY2FjaGUsIFxuICAgICAgICBfX21ldGFkYXRhKCdkZXNpZ246dHlwZScsIE9iamVjdClcbiAgICBdLCBDb250YWluZXIucHJvdG90eXBlLCBcImNvcmRvdmFcIiwgbnVsbCk7XG4gICAgX19kZWNvcmF0ZShbXG4gICAgICAgIGNhY2hlLCBcbiAgICAgICAgX19tZXRhZGF0YSgnZGVzaWduOnR5cGUnLCBPYmplY3QpXG4gICAgXSwgQ29udGFpbmVyLnByb3RvdHlwZSwgXCJzdG9yYWdlXCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwidXNlckNvbnRleHRcIiwgbnVsbCk7XG4gICAgX19kZWNvcmF0ZShbXG4gICAgICAgIGNhY2hlLCBcbiAgICAgICAgX19tZXRhZGF0YSgnZGVzaWduOnR5cGUnLCBPYmplY3QpXG4gICAgXSwgQ29udGFpbmVyLnByb3RvdHlwZSwgXCJzaW5nbGVVc2VyU2VydmljZVwiLCBudWxsKTtcbiAgICBfX2RlY29yYXRlKFtcbiAgICAgICAgY2FjaGUsIFxuICAgICAgICBfX21ldGFkYXRhKCdkZXNpZ246dHlwZScsIE9iamVjdClcbiAgICBdLCBDb250YWluZXIucHJvdG90eXBlLCBcImF1dGhNb2R1bGVzXCIsIG51bGwpO1xuICAgIF9fZGVjb3JhdGUoW1xuICAgICAgICBjYWNoZSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgT2JqZWN0KVxuICAgIF0sIENvbnRhaW5lci5wcm90b3R5cGUsIFwiYXV0aFwiLCBudWxsKTtcbiAgICBfX2RlY29yYXRlKFtcbiAgICAgICAgY2FjaGUsIFxuICAgICAgICBfX21ldGFkYXRhKCdkZXNpZ246dHlwZScsIE9iamVjdClcbiAgICBdLCBDb250YWluZXIucHJvdG90eXBlLCBcInB1c2hcIiwgbnVsbCk7XG4gICAgX19kZWNvcmF0ZShbXG4gICAgICAgIGNhY2hlLCBcbiAgICAgICAgX19tZXRhZGF0YSgnZGVzaWduOnR5cGUnLCBPYmplY3QpXG4gICAgXSwgQ29udGFpbmVyLnByb3RvdHlwZSwgXCJkZXBsb3lcIiwgbnVsbCk7XG4gICAgcmV0dXJuIENvbnRhaW5lcjtcbn0oKSk7XG5leHBvcnRzLkNvbnRhaW5lciA9IENvbnRhaW5lcjtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRXhjZXB0aW9uID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRXhjZXB0aW9uLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICB0aGlzLm5hbWUgPSAnRXhjZXB0aW9uJztcbiAgICAgICAgdGhpcy5zdGFjayA9IChuZXcgRXJyb3IoKSkuc3RhY2s7XG4gICAgfVxuICAgIEV4Y2VwdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUgKyBcIjogXCIgKyB0aGlzLm1lc3NhZ2U7XG4gICAgfTtcbiAgICByZXR1cm4gRXhjZXB0aW9uO1xufShFcnJvcikpO1xuZXhwb3J0cy5FeGNlcHRpb24gPSBFeGNlcHRpb247XG52YXIgRGV0YWlsZWRFcnJvciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKERldGFpbGVkRXJyb3IsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRGV0YWlsZWRFcnJvcihtZXNzYWdlLCBkZXRhaWxzKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICB0aGlzLmRldGFpbHMgPSBkZXRhaWxzO1xuICAgICAgICB0aGlzLm5hbWUgPSAnRGV0YWlsZWRFcnJvcic7XG4gICAgfVxuICAgIHJldHVybiBEZXRhaWxlZEVycm9yO1xufShFeGNlcHRpb24pKTtcbmV4cG9ydHMuRGV0YWlsZWRFcnJvciA9IERldGFpbGVkRXJyb3I7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBFdmVudEVtaXR0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMuZXZlbnRzRW1pdHRlZCA9IHt9O1xuICAgIH1cbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50XS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9O1xuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuZW1pdHRlZChldmVudCkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uKGV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfdGhpcy5lbWl0dGVkKGV2ZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgaWYgKGRhdGEgPT09IHZvaWQgMCkgeyBkYXRhID0gbnVsbDsgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmV2ZW50c0VtaXR0ZWRbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5ldmVudHNFbWl0dGVkW2V2ZW50XSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudF07IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBfYVtfaV07XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50c0VtaXR0ZWRbZXZlbnRdICs9IDE7XG4gICAgfTtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXR0ZWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmV2ZW50c0VtaXR0ZWRbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRzRW1pdHRlZFtldmVudF07XG4gICAgfTtcbiAgICByZXR1cm4gRXZlbnRFbWl0dGVyO1xufSgpKTtcbmV4cG9ydHMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgYXV0aF8xID0gcmVxdWlyZSgnLi9hdXRoJyk7XG5leHBvcnRzLkF1dGggPSBhdXRoXzEuQXV0aDtcbmV4cG9ydHMuQXV0aFR5cGUgPSBhdXRoXzEuQXV0aFR5cGU7XG5leHBvcnRzLkJhc2ljQXV0aCA9IGF1dGhfMS5CYXNpY0F1dGg7XG5leHBvcnRzLkN1c3RvbUF1dGggPSBhdXRoXzEuQ3VzdG9tQXV0aDtcbmV4cG9ydHMuVHdpdHRlckF1dGggPSBhdXRoXzEuVHdpdHRlckF1dGg7XG5leHBvcnRzLkZhY2Vib29rQXV0aCA9IGF1dGhfMS5GYWNlYm9va0F1dGg7XG5leHBvcnRzLkdpdGh1YkF1dGggPSBhdXRoXzEuR2l0aHViQXV0aDtcbmV4cG9ydHMuR29vZ2xlQXV0aCA9IGF1dGhfMS5Hb29nbGVBdXRoO1xuZXhwb3J0cy5JbnN0YWdyYW1BdXRoID0gYXV0aF8xLkluc3RhZ3JhbUF1dGg7XG5leHBvcnRzLkxpbmtlZEluQXV0aCA9IGF1dGhfMS5MaW5rZWRJbkF1dGg7XG52YXIgY2xpZW50XzEgPSByZXF1aXJlKCcuL2NsaWVudCcpO1xuZXhwb3J0cy5DbGllbnQgPSBjbGllbnRfMS5DbGllbnQ7XG52YXIgY29uZmlnXzEgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuZXhwb3J0cy5Db25maWcgPSBjb25maWdfMS5Db25maWc7XG52YXIgY29yZG92YV8xID0gcmVxdWlyZSgnLi9jb3Jkb3ZhJyk7XG5leHBvcnRzLkNvcmRvdmEgPSBjb3Jkb3ZhXzEuQ29yZG92YTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKCcuL2NvcmUnKTtcbmV4cG9ydHMuQ29yZSA9IGNvcmVfMS5Db3JlO1xudmFyIGRlcGxveV8xID0gcmVxdWlyZSgnLi9kZXBsb3kvZGVwbG95Jyk7XG5leHBvcnRzLkRlcGxveSA9IGRlcGxveV8xLkRlcGxveTtcbnZhciBkZXZpY2VfMSA9IHJlcXVpcmUoJy4vZGV2aWNlJyk7XG5leHBvcnRzLkRldmljZSA9IGRldmljZV8xLkRldmljZTtcbnZhciBkaV8xID0gcmVxdWlyZSgnLi9kaScpO1xuZXhwb3J0cy5ESUNvbnRhaW5lciA9IGRpXzEuQ29udGFpbmVyO1xudmFyIGV2ZW50c18xID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbmV4cG9ydHMuRXZlbnRFbWl0dGVyID0gZXZlbnRzXzEuRXZlbnRFbWl0dGVyO1xudmFyIGluc2lnaHRzXzEgPSByZXF1aXJlKCcuL2luc2lnaHRzJyk7XG5leHBvcnRzLkluc2lnaHRzID0gaW5zaWdodHNfMS5JbnNpZ2h0cztcbnZhciBsb2dnZXJfMSA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XG5leHBvcnRzLkxvZ2dlciA9IGxvZ2dlcl8xLkxvZ2dlcjtcbnZhciBwdXNoXzEgPSByZXF1aXJlKCcuL3B1c2gvcHVzaCcpO1xuZXhwb3J0cy5QdXNoID0gcHVzaF8xLlB1c2g7XG52YXIgc3RvcmFnZV8xID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XG5leHBvcnRzLlN0b3JhZ2UgPSBzdG9yYWdlXzEuU3RvcmFnZTtcbmV4cG9ydHMuTG9jYWxTdG9yYWdlU3RyYXRlZ3kgPSBzdG9yYWdlXzEuTG9jYWxTdG9yYWdlU3RyYXRlZ3k7XG5leHBvcnRzLlNlc3Npb25TdG9yYWdlU3RyYXRlZ3kgPSBzdG9yYWdlXzEuU2Vzc2lvblN0b3JhZ2VTdHJhdGVneTtcbnZhciB1c2VyXzEgPSByZXF1aXJlKCcuL3VzZXIvdXNlcicpO1xuZXhwb3J0cy5Vc2VyQ29udGV4dCA9IHVzZXJfMS5Vc2VyQ29udGV4dDtcbmV4cG9ydHMuVXNlciA9IHVzZXJfMS5Vc2VyO1xuZXhwb3J0cy5TaW5nbGVVc2VyU2VydmljZSA9IHVzZXJfMS5TaW5nbGVVc2VyU2VydmljZTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFN0YXQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0YXQoYXBwSWQsIHN0YXQsIHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7IHZhbHVlID0gMTsgfVxuICAgICAgICB0aGlzLmFwcElkID0gYXBwSWQ7XG4gICAgICAgIHRoaXMuc3RhdCA9IHN0YXQ7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5hcHBJZCA9IGFwcElkO1xuICAgICAgICB0aGlzLnN0YXQgPSBzdGF0O1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuY3JlYXRlZCA9IG5ldyBEYXRlKCk7XG4gICAgfVxuICAgIFN0YXQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFwcF9pZDogdGhpcy5hcHBJZCxcbiAgICAgICAgICAgIHN0YXQ6IHRoaXMuc3RhdCxcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnZhbHVlLFxuICAgICAgICAgICAgY3JlYXRlZDogdGhpcy5jcmVhdGVkLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gU3RhdDtcbn0oKSk7XG5leHBvcnRzLlN0YXQgPSBTdGF0O1xudmFyIEluc2lnaHRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnNpZ2h0cyhkZXBzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuc3VibWl0Q291bnQgPSBJbnNpZ2h0cy5TVUJNSVRfQ09VTlQ7XG4gICAgICAgIHRoaXMuYXBwID0gZGVwcy5hcHA7XG4gICAgICAgIHRoaXMuY2xpZW50ID0gZGVwcy5jbGllbnQ7XG4gICAgICAgIHRoaXMubG9nZ2VyID0gZGVwcy5sb2dnZXI7XG4gICAgICAgIHRoaXMuYmF0Y2ggPSBbXTtcbiAgICAgICAgaWYgKG9wdGlvbnMuaW50ZXJ2YWxTdWJtaXQpIHtcbiAgICAgICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5zdWJtaXQoKTtcbiAgICAgICAgICAgIH0sIG9wdGlvbnMuaW50ZXJ2YWxTdWJtaXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnN1Ym1pdENvdW50KSB7XG4gICAgICAgICAgICB0aGlzLnN1Ym1pdENvdW50ID0gb3B0aW9ucy5zdWJtaXRDb3VudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBJbnNpZ2h0cy5wcm90b3R5cGUudHJhY2sgPSBmdW5jdGlvbiAoc3RhdCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHsgdmFsdWUgPSAxOyB9XG4gICAgICAgIHRoaXMudHJhY2tTdGF0KG5ldyBTdGF0KHRoaXMuYXBwLmlkLCBzdGF0LCB2YWx1ZSkpO1xuICAgIH07XG4gICAgSW5zaWdodHMucHJvdG90eXBlLnRyYWNrU3RhdCA9IGZ1bmN0aW9uIChzdGF0KSB7XG4gICAgICAgIHRoaXMuYmF0Y2gucHVzaChzdGF0KTtcbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkU3VibWl0KCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEluc2lnaHRzLnByb3RvdHlwZS5zaG91bGRTdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJhdGNoLmxlbmd0aCA+PSB0aGlzLnN1Ym1pdENvdW50O1xuICAgIH07XG4gICAgSW5zaWdodHMucHJvdG90eXBlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuYmF0Y2gubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluc2lnaHRzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmJhdGNoOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIHN0YXQgPSBfYVtfaV07XG4gICAgICAgICAgICBpbnNpZ2h0cy5wdXNoKHN0YXQudG9KU09OKCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xpZW50LnBvc3QoJy9pbnNpZ2h0cycpXG4gICAgICAgICAgICAuc2VuZCh7ICdpbnNpZ2h0cyc6IGluc2lnaHRzIH0pXG4gICAgICAgICAgICAuZW5kKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIF90aGlzLmxvZ2dlci5lcnJvcignSW9uaWMgSW5zaWdodHM6IENvdWxkIG5vdCBzZW5kIGluc2lnaHRzLicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5sb2dnZXIuaW5mbygnSW9uaWMgSW5zaWdodHM6IFNlbnQgaW5zaWdodHMuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJhdGNoID0gW107XG4gICAgfTtcbiAgICBJbnNpZ2h0cy5TVUJNSVRfQ09VTlQgPSAxMDA7XG4gICAgcmV0dXJuIEluc2lnaHRzO1xufSgpKTtcbmV4cG9ydHMuSW5zaWdodHMgPSBJbnNpZ2h0cztcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIExvZ2dlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTG9nZ2VyKCkge1xuICAgICAgICB0aGlzLnNpbGVudCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmluZm9mbiA9IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgICAgIHRoaXMud2FybmZuID0gY29uc29sZS53YXJuLmJpbmQoY29uc29sZSk7XG4gICAgICAgIHRoaXMuZXJyb3JmbiA9IGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKTtcbiAgICB9XG4gICAgTG9nZ2VyLnByb3RvdHlwZS5pbmZvID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIG9wdGlvbmFsUGFyYW1zID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBvcHRpb25hbFBhcmFtc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuc2lsZW50KSB7XG4gICAgICAgICAgICB0aGlzLmluZm9mbi5hcHBseSh0aGlzLCBbbWVzc2FnZV0uY29uY2F0KG9wdGlvbmFsUGFyYW1zKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExvZ2dlci5wcm90b3R5cGUud2FybiA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIHZhciBvcHRpb25hbFBhcmFtcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgb3B0aW9uYWxQYXJhbXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnNpbGVudCkge1xuICAgICAgICAgICAgdGhpcy53YXJuZm4uYXBwbHkodGhpcywgW21lc3NhZ2VdLmNvbmNhdChvcHRpb25hbFBhcmFtcykpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMb2dnZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIG9wdGlvbmFsUGFyYW1zID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBvcHRpb25hbFBhcmFtc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVycm9yZm4uYXBwbHkodGhpcywgW21lc3NhZ2VdLmNvbmNhdChvcHRpb25hbFBhcmFtcykpO1xuICAgIH07XG4gICAgcmV0dXJuIExvZ2dlcjtcbn0oKSk7XG5leHBvcnRzLkxvZ2dlciA9IExvZ2dlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIERlZmVycmVkUHJvbWlzZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRGVmZXJyZWRQcm9taXNlKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBfdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIF90aGlzLnJlamVjdCA9IHJlamVjdDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBEZWZlcnJlZFByb21pc2U7XG59KCkpO1xuZXhwb3J0cy5EZWZlcnJlZFByb21pc2UgPSBEZWZlcnJlZFByb21pc2U7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBQdXNoTWVzc2FnZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHVzaE1lc3NhZ2UoKSB7XG4gICAgfVxuICAgIFB1c2hNZXNzYWdlLmZyb21QbHVnaW5EYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBuZXcgUHVzaE1lc3NhZ2UoKTtcbiAgICAgICAgbWVzc2FnZS5yYXcgPSBkYXRhO1xuICAgICAgICBtZXNzYWdlLnRleHQgPSBkYXRhLm1lc3NhZ2U7XG4gICAgICAgIG1lc3NhZ2UudGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgICAgICBtZXNzYWdlLmNvdW50ID0gZGF0YS5jb3VudDtcbiAgICAgICAgbWVzc2FnZS5zb3VuZCA9IGRhdGEuc291bmQ7XG4gICAgICAgIG1lc3NhZ2UuaW1hZ2UgPSBkYXRhLmltYWdlO1xuICAgICAgICBtZXNzYWdlLmFwcCA9IHtcbiAgICAgICAgICAgICdhc2xlZXAnOiAhZGF0YS5hZGRpdGlvbmFsRGF0YS5mb3JlZ3JvdW5kLFxuICAgICAgICAgICAgJ2Nsb3NlZCc6IGRhdGEuYWRkaXRpb25hbERhdGEuY29sZHN0YXJ0XG4gICAgICAgIH07XG4gICAgICAgIG1lc3NhZ2UucGF5bG9hZCA9IGRhdGEuYWRkaXRpb25hbERhdGFbJ3BheWxvYWQnXTtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgfTtcbiAgICBQdXNoTWVzc2FnZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIjxQdXNoTWVzc2FnZSBbXFxcIlwiICsgdGhpcy50aXRsZSArIFwiXFxcIl0+XCI7XG4gICAgfTtcbiAgICByZXR1cm4gUHVzaE1lc3NhZ2U7XG59KCkpO1xuZXhwb3J0cy5QdXNoTWVzc2FnZSA9IFB1c2hNZXNzYWdlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcHJvbWlzZV8xID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpO1xudmFyIHRva2VuXzEgPSByZXF1aXJlKCcuL3Rva2VuJyk7XG52YXIgbWVzc2FnZV8xID0gcmVxdWlyZSgnLi9tZXNzYWdlJyk7XG52YXIgUHVzaCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHVzaChkZXBzLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHRoaXMuYmxvY2tSZWdpc3RyYXRpb24gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ibG9ja1VucmVnaXN0ZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ibG9ja1NhdmVUb2tlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hcHAgPSBkZXBzLmFwcDtcbiAgICAgICAgdGhpcy5jb25maWcgPSBkZXBzLmNvbmZpZztcbiAgICAgICAgdGhpcy5hdXRoID0gZGVwcy5hdXRoO1xuICAgICAgICB0aGlzLnVzZXJTZXJ2aWNlID0gZGVwcy51c2VyU2VydmljZTtcbiAgICAgICAgdGhpcy5kZXZpY2UgPSBkZXBzLmRldmljZTtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBkZXBzLmNsaWVudDtcbiAgICAgICAgdGhpcy5lbWl0dGVyID0gZGVwcy5lbWl0dGVyO1xuICAgICAgICB0aGlzLnN0b3JhZ2UgPSBkZXBzLnN0b3JhZ2U7XG4gICAgICAgIHRoaXMubG9nZ2VyID0gZGVwcy5sb2dnZXI7XG4gICAgICAgIC8vIENoZWNrIGZvciB0aGUgcmVxdWlyZWQgdmFsdWVzIHRvIHVzZSB0aGlzIHNlcnZpY2VcbiAgICAgICAgaWYgKCF0aGlzLmFwcC5pZCkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0lvbmljIFB1c2g6IG5vIGFwcF9pZCBmb3VuZC4gKGh0dHA6Ly9kb2NzLmlvbmljLmlvL2RvY3MvaW8taW5zdGFsbCknKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLmRldmljZS5pc0FuZHJvaWQoKSAmJiAhdGhpcy5hcHAuZ2NtS2V5KSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignSW9uaWMgUHVzaDogR0NNIHByb2plY3QgbnVtYmVyIG5vdCBmb3VuZCAoaHR0cDovL2RvY3MuaW9uaWMuaW8vZG9jcy9wdXNoLWFuZHJvaWQtc2V0dXApJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLnBsdWdpbkNvbmZpZykge1xuICAgICAgICAgICAgb3B0aW9ucy5wbHVnaW5Db25maWcgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZXZpY2UuaXNBbmRyb2lkKCkpIHtcbiAgICAgICAgICAgIC8vIGluamVjdCBnY20ga2V5IGZvciBQdXNoUGx1Z2luXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMucGx1Z2luQ29uZmlnLmFuZHJvaWQpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnBsdWdpbkNvbmZpZy5hbmRyb2lkID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMucGx1Z2luQ29uZmlnLmFuZHJvaWQuc2VuZGVySWQpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnBsdWdpbkNvbmZpZy5hbmRyb2lkLnNlbmRlcklEID0gdGhpcy5hcHAuZ2NtS2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQdXNoLnByb3RvdHlwZSwgXCJ0b2tlblwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl90b2tlbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Rva2VuID0gbmV3IHRva2VuXzEuUHVzaFRva2VuKHRoaXMuc3RvcmFnZS5nZXQoJ2lvbmljX2lvX3B1c2hfdG9rZW4nKS50b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdG9rZW47XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JhZ2UuZGVsZXRlKCdpb25pY19pb19wdXNoX3Rva2VuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JhZ2Uuc2V0KCdpb25pY19pb19wdXNoX3Rva2VuJywgeyAndG9rZW4nOiB2YWwudG9rZW4gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl90b2tlbiA9IHZhbDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgUHVzaC5wcm90b3R5cGUuc2F2ZVRva2VuID0gZnVuY3Rpb24gKHRva2VuLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBwcm9taXNlXzEuRGVmZXJyZWRQcm9taXNlKCk7XG4gICAgICAgIHZhciB0b2tlbkRhdGEgPSB7XG4gICAgICAgICAgICAndG9rZW4nOiB0b2tlbi50b2tlbixcbiAgICAgICAgICAgICdhcHBfaWQnOiB0aGlzLmNvbmZpZy5nZXQoJ2FwcF9pZCcpXG4gICAgICAgIH07XG4gICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVfdXNlcikge1xuICAgICAgICAgICAgdmFyIHVzZXIgPSB0aGlzLnVzZXJTZXJ2aWNlLmN1cnJlbnQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICB0b2tlbkRhdGEudXNlcl9pZCA9IHVzZXIuaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmJsb2NrU2F2ZVRva2VuKSB7XG4gICAgICAgICAgICB0aGlzLmNsaWVudC5wb3N0KCcvcHVzaC90b2tlbnMnKVxuICAgICAgICAgICAgICAgIC5zZW5kKHRva2VuRGF0YSlcbiAgICAgICAgICAgICAgICAuZW5kKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYmxvY2tTYXZlVG9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMubG9nZ2VyLmVycm9yKCdJb25pYyBQdXNoOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYmxvY2tTYXZlVG9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMubG9nZ2VyLmluZm8oJ0lvbmljIFB1c2g6IHNhdmVkIHB1c2ggdG9rZW46ICcgKyB0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbkRhdGEudXNlcl9pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMubG9nZ2VyLmluZm8oJ0lvbmljIFB1c2g6IGFkZGVkIHB1c2ggdG9rZW4gdG8gdXNlcjogJyArIHRva2VuRGF0YS51c2VyX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0b2tlbi5zYXZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcignQSB0b2tlbiBzYXZlIG9wZXJhdGlvbiBpcyBhbHJlYWR5IGluIHByb2dyZXNzLicpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyB0aGUgZGV2aWNlIHdpdGggR0NNL0FQTlMgdG8gZ2V0IGEgZGV2aWNlIHRva2VuXG4gICAgICovXG4gICAgUHVzaC5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBwcm9taXNlXzEuRGVmZXJyZWRQcm9taXNlKCk7XG4gICAgICAgIGlmICh0aGlzLmJsb2NrUmVnaXN0cmF0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKCdBbm90aGVyIHJlZ2lzdHJhdGlvbiBpcyBhbHJlYWR5IGluIHByb2dyZXNzLicpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYmxvY2tSZWdpc3RyYXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoJ2RldmljZTpyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHVzaFBsdWdpbiA9IF90aGlzLl9nZXRQdXNoUGx1Z2luKCk7XG4gICAgICAgICAgICAgICAgaWYgKHB1c2hQbHVnaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucGx1Z2luID0gcHVzaFBsdWdpbi5pbml0KF90aGlzLm9wdGlvbnMucGx1Z2luQ29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucGx1Z2luLm9uKCdyZWdpc3RyYXRpb24nLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuYmxvY2tSZWdpc3RyYXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRva2VuID0gbmV3IHRva2VuXzEuUHVzaFRva2VuKGRhdGEucmVnaXN0cmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMudG9rZW4ucmVnaXN0ZXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF90aGlzLnRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxsYmFja1JlZ2lzdHJhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZWdpc3RlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChuZXcgRXJyb3IoJ1B1c2ggcGx1Z2luIG5vdCBmb3VuZCEgU2VlIGxvZ3MuJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogSW52YWxpZGF0ZSB0aGUgY3VycmVudCBHQ00vQVBOUyB0b2tlblxuICAgICAqL1xuICAgIFB1c2gucHJvdG90eXBlLnVucmVnaXN0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBwcm9taXNlXzEuRGVmZXJyZWRQcm9taXNlKCk7XG4gICAgICAgIGlmICghdGhpcy5ibG9ja1VucmVnaXN0ZXIpIHtcbiAgICAgICAgICAgIHZhciBwdXNoVG9rZW5fMSA9IHRoaXMudG9rZW47XG4gICAgICAgICAgICBpZiAoIXB1c2hUb2tlbl8xKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VuRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ3Rva2VuJzogcHVzaFRva2VuXzEudG9rZW4sXG4gICAgICAgICAgICAgICAgICAgICdhcHBfaWQnOiB0aGlzLmNvbmZpZy5nZXQoJ2FwcF9pZCcpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wbHVnaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udW5yZWdpc3RlcihmdW5jdGlvbiAoKSB7IH0sIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50LnBvc3QoJy9wdXNoL3Rva2Vucy9pbnZhbGlkYXRlJylcbiAgICAgICAgICAgICAgICAgICAgLnNlbmQodG9rZW5EYXRhKVxuICAgICAgICAgICAgICAgICAgICAuZW5kKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5ibG9ja1VucmVnaXN0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMubG9nZ2VyLmVycm9yKCdJb25pYyBQdXNoOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmxvZ2dlci5pbmZvKCdJb25pYyBQdXNoOiB1bnJlZ2lzdGVyZWQgcHVzaCB0b2tlbjogJyArIHB1c2hUb2tlbl8xLnRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRva2VuID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcignQW4gdW5yZWdpc3RlciBvcGVyYXRpb24gaXMgYWxyZWFkeSBpbiBwcm9ncmVzcy4nKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ibG9ja1VucmVnaXN0ZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBjYWxsYmFja3Mgd2l0aCB0aGUgUHVzaFBsdWdpblxuICAgICAqL1xuICAgIFB1c2gucHJvdG90eXBlLl9jYWxsYmFja1JlZ2lzdHJhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5wbHVnaW4ub24oJ3JlZ2lzdHJhdGlvbicsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBfdGhpcy50b2tlbiA9IG5ldyB0b2tlbl8xLlB1c2hUb2tlbihkYXRhLnJlZ2lzdHJhdGlvbklkKTtcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMubG9nZ2VyLmluZm8oJ0lvbmljIFB1c2ggKGRlYnVnKTogZGV2aWNlIHRva2VuIHJlZ2lzdGVyZWQ6ICcgKyBfdGhpcy50b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5lbWl0dGVyLmVtaXQoJ3B1c2g6cmVnaXN0ZXInLCB7ICd0b2tlbic6IGRhdGEucmVnaXN0cmF0aW9uSWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBsdWdpbi5vbignbm90aWZpY2F0aW9uJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbWVzc2FnZV8xLlB1c2hNZXNzYWdlLmZyb21QbHVnaW5EYXRhKGRhdGEpO1xuICAgICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuZGVidWcpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5sb2dnZXIuaW5mbygnSW9uaWMgUHVzaCAoZGVidWcpOiBub3RpZmljYXRpb24gcmVjZWl2ZWQ6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmVtaXR0ZXIuZW1pdCgncHVzaDpub3RpZmljYXRpb24nLCB7ICdtZXNzYWdlJzogbWVzc2FnZSwgJ3Jhdyc6IGRhdGEgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBsdWdpbi5vbignZXJyb3InLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuZGVidWcpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5sb2dnZXIuZXJyb3IoJ0lvbmljIFB1c2ggKGRlYnVnKTogdW5leHBlY3RlZCBlcnJvciBvY2N1cmVkLicpO1xuICAgICAgICAgICAgICAgIF90aGlzLmxvZ2dlci5lcnJvcignSW9uaWMgUHVzaDonLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmVtaXR0ZXIuZW1pdCgncHVzaDplcnJvcicsIHsgJ2Vycic6IGUgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHVzaC5wcm90b3R5cGUuX2dldFB1c2hQbHVnaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwbHVnaW4gPSB3aW5kb3cuUHVzaE5vdGlmaWNhdGlvbjtcbiAgICAgICAgaWYgKCFwbHVnaW4pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRldmljZS5pc0lPUygpIHx8IHRoaXMuZGV2aWNlLmlzQW5kcm9pZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0lvbmljIFB1c2g6IFB1c2hOb3RpZmljYXRpb24gcGx1Z2luIGlzIHJlcXVpcmVkLiBIYXZlIHlvdSBydW4gYGlvbmljIHBsdWdpbiBhZGQgcGhvbmVnYXAtcGx1Z2luLXB1c2hgID8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ0lvbmljIFB1c2g6IERpc2FibGVkISBOYXRpdmUgcHVzaCBub3RpZmljYXRpb25zIHdpbGwgbm90IHdvcmsgaW4gYSBicm93c2VyLiBSdW4geW91ciBhcHAgb24gYW4gYWN0dWFsIGRldmljZSB0byB1c2UgcHVzaC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGx1Z2luO1xuICAgIH07XG4gICAgcmV0dXJuIFB1c2g7XG59KCkpO1xuZXhwb3J0cy5QdXNoID0gUHVzaDtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIFB1c2hUb2tlbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHVzaFRva2VuKHRva2VuKSB7XG4gICAgICAgIHRoaXMudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgdGhpcy5yZWdpc3RlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICAgIH1cbiAgICBQdXNoVG9rZW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCI8UHVzaFRva2VuIFtcIiArIHRoaXMudG9rZW4gKyBcIl0+XCI7XG4gICAgfTtcbiAgICByZXR1cm4gUHVzaFRva2VuO1xufSgpKTtcbmV4cG9ydHMuUHVzaFRva2VuID0gUHVzaFRva2VuO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgTG9jYWxTdG9yYWdlU3RyYXRlZ3kgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvY2FsU3RvcmFnZVN0cmF0ZWd5KCkge1xuICAgIH1cbiAgICBMb2NhbFN0b3JhZ2VTdHJhdGVneS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICB9O1xuICAgIExvY2FsU3RvcmFnZVN0cmF0ZWd5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICAgIH07XG4gICAgTG9jYWxTdG9yYWdlU3RyYXRlZ3kucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbHVlKTtcbiAgICB9O1xuICAgIHJldHVybiBMb2NhbFN0b3JhZ2VTdHJhdGVneTtcbn0oKSk7XG5leHBvcnRzLkxvY2FsU3RvcmFnZVN0cmF0ZWd5ID0gTG9jYWxTdG9yYWdlU3RyYXRlZ3k7XG52YXIgU2Vzc2lvblN0b3JhZ2VTdHJhdGVneSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2Vzc2lvblN0b3JhZ2VTdHJhdGVneSgpIHtcbiAgICB9XG4gICAgU2Vzc2lvblN0b3JhZ2VTdHJhdGVneS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIH07XG4gICAgU2Vzc2lvblN0b3JhZ2VTdHJhdGVneS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICAgIH07XG4gICAgU2Vzc2lvblN0b3JhZ2VTdHJhdGVneS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oa2V5LCB2YWx1ZSk7XG4gICAgfTtcbiAgICByZXR1cm4gU2Vzc2lvblN0b3JhZ2VTdHJhdGVneTtcbn0oKSk7XG5leHBvcnRzLlNlc3Npb25TdG9yYWdlU3RyYXRlZ3kgPSBTZXNzaW9uU3RvcmFnZVN0cmF0ZWd5O1xudmFyIFN0b3JhZ2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0b3JhZ2UoZGVwcywgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7ICdjYWNoZSc6IHRydWUgfTsgfVxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLnN0cmF0ZWd5ID0gZGVwcy5zdHJhdGVneTtcbiAgICAgICAgdGhpcy5zdG9yYWdlQ2FjaGUgPSB7fTtcbiAgICB9XG4gICAgU3RvcmFnZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ3kuc2V0KGtleSwganNvbik7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2FjaGUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmFnZUNhY2hlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RvcmFnZS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB0aGlzLnN0cmF0ZWd5LnJlbW92ZShrZXkpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNhY2hlKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdG9yYWdlQ2FjaGVba2V5XTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3RvcmFnZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNhY2hlKSB7XG4gICAgICAgICAgICB2YXIgY2FjaGVkID0gdGhpcy5zdG9yYWdlQ2FjaGVba2V5XTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBqc29uID0gdGhpcy5zdHJhdGVneS5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFqc29uKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2FjaGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JhZ2VDYWNoZVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBTdG9yYWdlO1xufSgpKTtcbmV4cG9ydHMuU3RvcmFnZSA9IFN0b3JhZ2U7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBkYXRhVHlwZU1hcHBpbmcgPSB7fTtcbnZhciBEYXRhVHlwZVNjaGVtYSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRGF0YVR5cGVTY2hlbWEocHJvcGVydGllcykge1xuICAgICAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5zZXRQcm9wZXJ0aWVzKHByb3BlcnRpZXMpO1xuICAgIH1cbiAgICBEYXRhVHlwZVNjaGVtYS5wcm90b3R5cGUuc2V0UHJvcGVydGllcyA9IGZ1bmN0aW9uIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0aWVzIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciB4IGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFbeF0gPSBwcm9wZXJ0aWVzW3hdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBEYXRhVHlwZVNjaGVtYS5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdfX0lvbmljX0RhdGFUeXBlU2NoZW1hJzogZGF0YS5uYW1lLFxuICAgICAgICAgICAgJ3ZhbHVlJzogZGF0YS52YWx1ZVxuICAgICAgICB9O1xuICAgIH07XG4gICAgRGF0YVR5cGVTY2hlbWEucHJvdG90eXBlLmlzVmFsaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGEubmFtZSAmJiB0aGlzLmRhdGEudmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiBEYXRhVHlwZVNjaGVtYTtcbn0oKSk7XG5leHBvcnRzLkRhdGFUeXBlU2NoZW1hID0gRGF0YVR5cGVTY2hlbWE7XG52YXIgRGF0YVR5cGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERhdGFUeXBlKCkge1xuICAgIH1cbiAgICBEYXRhVHlwZS5nZXQgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGRhdGFUeXBlTWFwcGluZ1tuYW1lXSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkYXRhVHlwZU1hcHBpbmdbbmFtZV0odmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIERhdGFUeXBlLmdldE1hcHBpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBkYXRhVHlwZU1hcHBpbmc7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRGF0YVR5cGUsIFwiU2NoZW1hXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gRGF0YVR5cGVTY2hlbWE7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIERhdGFUeXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIGNscykge1xuICAgICAgICBkYXRhVHlwZU1hcHBpbmdbbmFtZV0gPSBjbHM7XG4gICAgfTtcbiAgICByZXR1cm4gRGF0YVR5cGU7XG59KCkpO1xuZXhwb3J0cy5EYXRhVHlwZSA9IERhdGFUeXBlO1xudmFyIFVuaXF1ZUFycmF5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVbmlxdWVBcnJheSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHggaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2godmFsdWVbeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFVuaXF1ZUFycmF5LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5kYXRhO1xuICAgICAgICB2YXIgc2NoZW1hID0gbmV3IERhdGFUeXBlU2NoZW1hKHsgJ25hbWUnOiAnVW5pcXVlQXJyYXknLCAndmFsdWUnOiBkYXRhIH0pO1xuICAgICAgICByZXR1cm4gc2NoZW1hLnRvSlNPTigpO1xuICAgIH07XG4gICAgVW5pcXVlQXJyYXkuZnJvbVN0b3JhZ2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVbmlxdWVBcnJheSh2YWx1ZSk7XG4gICAgfTtcbiAgICBVbmlxdWVBcnJheS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5kYXRhLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5kYXRhLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBVbmlxdWVBcnJheS5wcm90b3R5cGUucHVsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmRhdGEuaW5kZXhPZih2YWx1ZSk7XG4gICAgICAgIHRoaXMuZGF0YS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH07XG4gICAgcmV0dXJuIFVuaXF1ZUFycmF5O1xufSgpKTtcbmV4cG9ydHMuVW5pcXVlQXJyYXkgPSBVbmlxdWVBcnJheTtcbkRhdGFUeXBlLnJlZ2lzdGVyKCdVbmlxdWVBcnJheScsIFVuaXF1ZUFycmF5KTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIHByb21pc2VfMSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKTtcbnZhciBkYXRhX3R5cGVzXzEgPSByZXF1aXJlKCcuL2RhdGEtdHlwZXMnKTtcbnZhciBVc2VyQ29udGV4dCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXNlckNvbnRleHQoZGVwcykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGRlcHMuY29uZmlnO1xuICAgICAgICB0aGlzLnN0b3JhZ2UgPSBkZXBzLnN0b3JhZ2U7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShVc2VyQ29udGV4dC5wcm90b3R5cGUsIFwibGFiZWxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnaW9uaWNfaW9fdXNlcl8nICsgdGhpcy5jb25maWcuZ2V0KCdhcHBfaWQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgVXNlckNvbnRleHQucHJvdG90eXBlLnVuc3RvcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc3RvcmFnZS5kZWxldGUodGhpcy5sYWJlbCk7XG4gICAgfTtcbiAgICBVc2VyQ29udGV4dC5wcm90b3R5cGUuc3RvcmUgPSBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB0aGlzLnN0b3JhZ2Uuc2V0KHRoaXMubGFiZWwsIHVzZXIuc2VyaWFsaXplRm9yU3RvcmFnZSgpKTtcbiAgICB9O1xuICAgIFVzZXJDb250ZXh0LnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLnN0b3JhZ2UuZ2V0KHRoaXMubGFiZWwpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgdXNlci5pZCA9IGRhdGEuaWQ7XG4gICAgICAgICAgICB1c2VyLmRhdGEgPSBuZXcgVXNlckRhdGEoZGF0YS5kYXRhKTtcbiAgICAgICAgICAgIHVzZXIuZGV0YWlscyA9IGRhdGEuZGV0YWlscyB8fCB7fTtcbiAgICAgICAgICAgIHVzZXIuZnJlc2ggPSBkYXRhLmZyZXNoO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH07XG4gICAgcmV0dXJuIFVzZXJDb250ZXh0O1xufSgpKTtcbmV4cG9ydHMuVXNlckNvbnRleHQgPSBVc2VyQ29udGV4dDtcbnZhciBVc2VyRGF0YSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXNlckRhdGEoZGF0YSkge1xuICAgICAgICBpZiAoZGF0YSA9PT0gdm9pZCAwKSB7IGRhdGEgPSB7fTsgfVxuICAgICAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICAgICAgaWYgKCh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcpKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICAgICAgdGhpcy5kZXNlcmlhbGl6ZXJEYXRhVHlwZXMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBVc2VyRGF0YS5wcm90b3R5cGUuZGVzZXJpYWxpemVyRGF0YVR5cGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5kYXRhKSB7XG4gICAgICAgICAgICBmb3IgKHZhciB4IGluIHRoaXMuZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHdlIGhhdmUgYW4gb2JqZWN0LCBsZXQncyBjaGVjayBmb3IgY3VzdG9tIGRhdGEgdHlwZXNcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuZGF0YVt4XSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG8gd2UgaGF2ZSBhIGN1c3RvbSB0eXBlP1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhW3hdLl9fSW9uaWNfRGF0YVR5cGVTY2hlbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5kYXRhW3hdLl9fSW9uaWNfRGF0YVR5cGVTY2hlbWE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwcGluZyA9IGRhdGFfdHlwZXNfMS5EYXRhVHlwZS5nZXRNYXBwaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFwcGluZ1tuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgYSBjdXN0b20gdHlwZSBhbmQgYSByZWdpc3RlcmVkIGNsYXNzLCBnaXZlIHRoZSBjdXN0b20gZGF0YSB0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZnJvbSBzdG9yYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhW3hdID0gbWFwcGluZ1tuYW1lXS5mcm9tU3RvcmFnZSh0aGlzLmRhdGFbeF0udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBVc2VyRGF0YS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSwgZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGRlZmF1bHRWYWx1ZSA9PT0gMCB8fCBkZWZhdWx0VmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWUgfHwgbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVXNlckRhdGEucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgfTtcbiAgICBVc2VyRGF0YS5wcm90b3R5cGUudW5zZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmRhdGFba2V5XTtcbiAgICB9O1xuICAgIHJldHVybiBVc2VyRGF0YTtcbn0oKSk7XG5leHBvcnRzLlVzZXJEYXRhID0gVXNlckRhdGE7XG52YXIgVXNlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXNlcihkZXBzKSB7XG4gICAgICAgIHRoaXMuZGV0YWlscyA9IHt9O1xuICAgICAgICB0aGlzLnNlcnZpY2UgPSBkZXBzLnNlcnZpY2U7XG4gICAgICAgIHRoaXMuZnJlc2ggPSB0cnVlO1xuICAgICAgICB0aGlzLl91bnNldCA9IHt9O1xuICAgICAgICB0aGlzLmRhdGEgPSBuZXcgVXNlckRhdGEoKTtcbiAgICB9XG4gICAgVXNlci5wcm90b3R5cGUuaXNBbm9ueW1vdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5pZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFVzZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXksIGRlZmF1bHRWYWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLmdldChrZXksIGRlZmF1bHRWYWx1ZSk7XG4gICAgfTtcbiAgICBVc2VyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICBkZWxldGUgdGhpcy5fdW5zZXRba2V5XTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfTtcbiAgICBVc2VyLnByb3RvdHlwZS51bnNldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdGhpcy5fdW5zZXRba2V5XSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEudW5zZXQoa2V5KTtcbiAgICB9O1xuICAgIFVzZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy5kYXRhID0gbmV3IFVzZXJEYXRhKCk7XG4gICAgICAgIHRoaXMuZGV0YWlscyA9IHt9O1xuICAgICAgICB0aGlzLmZyZXNoID0gdHJ1ZTtcbiAgICB9O1xuICAgIFVzZXIucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3Vuc2V0ID0ge307XG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2Uuc2F2ZSgpO1xuICAgIH07XG4gICAgVXNlci5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLmRlbGV0ZSgpO1xuICAgIH07XG4gICAgVXNlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLmxvYWQoaWQpO1xuICAgIH07XG4gICAgVXNlci5wcm90b3R5cGUuc3RvcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2VydmljZS5zdG9yZSgpO1xuICAgIH07XG4gICAgVXNlci5wcm90b3R5cGUudW5zdG9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlLnVuc3RvcmUoKTtcbiAgICB9O1xuICAgIFVzZXIucHJvdG90eXBlLnNlcmlhbGl6ZUZvckFQSSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdlbWFpbCc6IHRoaXMuZGV0YWlscy5lbWFpbCxcbiAgICAgICAgICAgICdwYXNzd29yZCc6IHRoaXMuZGV0YWlscy5wYXNzd29yZCxcbiAgICAgICAgICAgICd1c2VybmFtZSc6IHRoaXMuZGV0YWlscy51c2VybmFtZSxcbiAgICAgICAgICAgICdpbWFnZSc6IHRoaXMuZGV0YWlscy5pbWFnZSxcbiAgICAgICAgICAgICduYW1lJzogdGhpcy5kZXRhaWxzLm5hbWUsXG4gICAgICAgICAgICAnY3VzdG9tJzogdGhpcy5kYXRhLmRhdGFcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIFVzZXIucHJvdG90eXBlLnNlcmlhbGl6ZUZvclN0b3JhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnaWQnOiB0aGlzLmlkLFxuICAgICAgICAgICAgJ2RhdGEnOiB0aGlzLmRhdGEuZGF0YSxcbiAgICAgICAgICAgICdkZXRhaWxzJzogdGhpcy5kZXRhaWxzLFxuICAgICAgICAgICAgJ2ZyZXNoJzogdGhpcy5mcmVzaFxuICAgICAgICB9O1xuICAgIH07XG4gICAgVXNlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIjxVc2VyIFtcIiArICh0aGlzLmlzQW5vbnltb3VzKCkgPyAnYW5vbnltb3VzJyA6IHRoaXMuaWQpICsgXCJdPlwiO1xuICAgIH07XG4gICAgcmV0dXJuIFVzZXI7XG59KCkpO1xuZXhwb3J0cy5Vc2VyID0gVXNlcjtcbnZhciBTaW5nbGVVc2VyU2VydmljZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2luZ2xlVXNlclNlcnZpY2UoZGVwcywgY29uZmlnKSB7XG4gICAgICAgIGlmIChjb25maWcgPT09IHZvaWQgMCkgeyBjb25maWcgPSB7fTsgfVxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5jbGllbnQgPSBkZXBzLmNsaWVudDtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gZGVwcy5jb250ZXh0O1xuICAgIH1cbiAgICBTaW5nbGVVc2VyU2VydmljZS5wcm90b3R5cGUuY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHRoaXMuY29udGV4dC5sb2FkKG5ldyBVc2VyKHsgJ3NlcnZpY2UnOiB0aGlzIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudXNlcikge1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbmV3IFVzZXIoeyAnc2VydmljZSc6IHRoaXMgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMudXNlcjtcbiAgICB9O1xuICAgIFNpbmdsZVVzZXJTZXJ2aWNlLnByb3RvdHlwZS5zdG9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnN0b3JlKHRoaXMuY3VycmVudCgpKTtcbiAgICB9O1xuICAgIFNpbmdsZVVzZXJTZXJ2aWNlLnByb3RvdHlwZS51bnN0b3JlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQudW5zdG9yZSgpO1xuICAgIH07XG4gICAgU2luZ2xlVXNlclNlcnZpY2UucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgaWYgKGlkID09PSB2b2lkIDApIHsgaWQgPSAnc2VsZic7IH1cbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IHByb21pc2VfMS5EZWZlcnJlZFByb21pc2UoKTtcbiAgICAgICAgdmFyIHVzZXIgPSB0aGlzLmN1cnJlbnQoKTtcbiAgICAgICAgdGhpcy5jbGllbnQuZ2V0KFwiL3VzZXJzL1wiICsgaWQpXG4gICAgICAgICAgICAuZW5kKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXNlci5pZCA9IHJlcy5ib2R5LmRhdGEudXVpZDtcbiAgICAgICAgICAgICAgICB1c2VyLmRhdGEgPSBuZXcgVXNlckRhdGEocmVzLmJvZHkuZGF0YS5jdXN0b20pO1xuICAgICAgICAgICAgICAgIHVzZXIuZGV0YWlscyA9IHJlcy5ib2R5LmRhdGEuZGV0YWlscztcbiAgICAgICAgICAgICAgICB1c2VyLmZyZXNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgICBTaW5nbGVVc2VyU2VydmljZS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBuZXcgcHJvbWlzZV8xLkRlZmVycmVkUHJvbWlzZSgpO1xuICAgICAgICBpZiAodGhpcy51c2VyLmlzQW5vbnltb3VzKCkpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChuZXcgRXJyb3IoJ1VzZXIgaXMgYW5vbnltb3VzIGFuZCBjYW5ub3QgYmUgZGVsZXRlZCBmcm9tIHRoZSBBUEkuJykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51bnN0b3JlKCk7XG4gICAgICAgICAgICB0aGlzLmNsaWVudC5kZWxldGUoXCIvdXNlcnMvXCIgKyB0aGlzLnVzZXIuaWQpXG4gICAgICAgICAgICAgICAgLmVuZChmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gICAgU2luZ2xlVXNlclNlcnZpY2UucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IG5ldyBwcm9taXNlXzEuRGVmZXJyZWRQcm9taXNlKCk7XG4gICAgICAgIHRoaXMuc3RvcmUoKTtcbiAgICAgICAgaWYgKHRoaXMudXNlci5pc0Fub255bW91cygpKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKCdVc2VyIGlzIGFub255bW91cyBhbmQgY2Fubm90IGJlIHVwZGF0ZWQgaW4gdGhlIEFQSS4gVXNlIGxvYWQoPGlkPikgb3Igc2lnbnVwIGEgdXNlciB1c2luZyBhdXRoLicpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2xpZW50LnBhdGNoKFwiL3VzZXJzL1wiICsgdGhpcy51c2VyLmlkKVxuICAgICAgICAgICAgICAgIC5zZW5kKHRoaXMudXNlci5zZXJpYWxpemVGb3JBUEkoKSlcbiAgICAgICAgICAgICAgICAuZW5kKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy51c2VyLmZyZXNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICAgIHJldHVybiBTaW5nbGVVc2VyU2VydmljZTtcbn0oKSk7XG5leHBvcnRzLlNpbmdsZVVzZXJTZXJ2aWNlID0gU2luZ2xlVXNlclNlcnZpY2U7XG4iLCJcclxuLyoqXHJcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXHJcbiAqL1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcclxuICBpZiAob2JqKSByZXR1cm4gbWl4aW4ob2JqKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXHJcbiAqIEByZXR1cm4ge09iamVjdH1cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XHJcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XHJcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV07XHJcbiAgfVxyXG4gIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XHJcbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuICAodGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW10pXHJcbiAgICAucHVzaChmbik7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXHJcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxyXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG4gIGZ1bmN0aW9uIG9uKCkge1xyXG4gICAgdGhpcy5vZmYoZXZlbnQsIG9uKTtcclxuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgfVxyXG5cclxuICBvbi5mbiA9IGZuO1xyXG4gIHRoaXMub24oZXZlbnQsIG9uKTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxyXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXHJcbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cclxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcclxuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XHJcblxyXG4gIC8vIGFsbFxyXG4gIGlmICgwID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvLyBzcGVjaWZpYyBldmVudFxyXG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcclxuXHJcbiAgLy8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xyXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvLyByZW1vdmUgc3BlY2lmaWMgaGFuZGxlclxyXG4gIHZhciBjYjtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xyXG4gICAgY2IgPSBjYWxsYmFja3NbaV07XHJcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xyXG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge01peGVkfSAuLi5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxyXG4gICAgLCBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xyXG5cclxuICBpZiAoY2FsbGJhY2tzKSB7XHJcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XHJcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcmV0dXJuIHtBcnJheX1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xyXG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xyXG59O1xyXG4iLCJcbi8qKlxuICogUmVkdWNlIGBhcnJgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge01peGVkfSBpbml0aWFsXG4gKlxuICogVE9ETzogY29tYmF0aWJsZSBlcnJvciBoYW5kbGluZz9cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgZm4sIGluaXRpYWwpeyAgXG4gIHZhciBpZHggPSAwO1xuICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgdmFyIGN1cnIgPSBhcmd1bWVudHMubGVuZ3RoID09IDNcbiAgICA/IGluaXRpYWxcbiAgICA6IGFycltpZHgrK107XG5cbiAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgIGN1cnIgPSBmbi5jYWxsKG51bGwsIGN1cnIsIGFycltpZHhdLCArK2lkeCwgYXJyKTtcbiAgfVxuICBcbiAgcmV0dXJuIGN1cnI7XG59OyIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKTtcbnZhciByZWR1Y2UgPSByZXF1aXJlKCdyZWR1Y2UnKTtcbnZhciByZXF1ZXN0QmFzZSA9IHJlcXVpcmUoJy4vcmVxdWVzdC1iYXNlJyk7XG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzLW9iamVjdCcpO1xuXG4vKipcbiAqIFJvb3QgcmVmZXJlbmNlIGZvciBpZnJhbWVzLlxuICovXG5cbnZhciByb290O1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7IC8vIEJyb3dzZXIgd2luZG93XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykgeyAvLyBXZWIgV29ya2VyXG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIHsgLy8gT3RoZXIgZW52aXJvbm1lbnRzXG4gIHJvb3QgPSB0aGlzO1xufVxuXG4vKipcbiAqIE5vb3AuXG4gKi9cblxuZnVuY3Rpb24gbm9vcCgpe307XG5cbi8qKlxuICogQ2hlY2sgaWYgYG9iamAgaXMgYSBob3N0IG9iamVjdCxcbiAqIHdlIGRvbid0IHdhbnQgdG8gc2VyaWFsaXplIHRoZXNlIDopXG4gKlxuICogVE9ETzogZnV0dXJlIHByb29mLCBtb3ZlIHRvIGNvbXBvZW50IGxhbmRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaXNIb3N0KG9iaikge1xuICB2YXIgc3RyID0ge30udG9TdHJpbmcuY2FsbChvYmopO1xuXG4gIHN3aXRjaCAoc3RyKSB7XG4gICAgY2FzZSAnW29iamVjdCBGaWxlXSc6XG4gICAgY2FzZSAnW29iamVjdCBCbG9iXSc6XG4gICAgY2FzZSAnW29iamVjdCBGb3JtRGF0YV0nOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIEV4cG9zZSBgcmVxdWVzdGAuXG4gKi9cblxudmFyIHJlcXVlc3QgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpLmJpbmQobnVsbCwgUmVxdWVzdCk7XG5cbi8qKlxuICogRGV0ZXJtaW5lIFhIUi5cbiAqL1xuXG5yZXF1ZXN0LmdldFhIUiA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHJvb3QuWE1MSHR0cFJlcXVlc3RcbiAgICAgICYmICghcm9vdC5sb2NhdGlvbiB8fCAnZmlsZTonICE9IHJvb3QubG9jYXRpb24ucHJvdG9jb2xcbiAgICAgICAgICB8fCAhcm9vdC5BY3RpdmVYT2JqZWN0KSkge1xuICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3Q7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpOyB9IGNhdGNoKGUpIHt9XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUC42LjAnKTsgfSBjYXRjaChlKSB7fVxuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTXN4bWwyLlhNTEhUVFAuMy4wJyk7IH0gY2F0Y2goZSkge31cbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQJyk7IH0gY2F0Y2goZSkge31cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSwgYWRkZWQgdG8gc3VwcG9ydCBJRS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIHRyaW0gPSAnJy50cmltXG4gID8gZnVuY3Rpb24ocykgeyByZXR1cm4gcy50cmltKCk7IH1cbiAgOiBmdW5jdGlvbihzKSB7IHJldHVybiBzLnJlcGxhY2UoLyheXFxzKnxcXHMqJCkvZywgJycpOyB9O1xuXG4vKipcbiAqIFNlcmlhbGl6ZSB0aGUgZ2l2ZW4gYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VyaWFsaXplKG9iaikge1xuICBpZiAoIWlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gIHZhciBwYWlycyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKG51bGwgIT0gb2JqW2tleV0pIHtcbiAgICAgIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICByZXR1cm4gcGFpcnMuam9pbignJicpO1xufVxuXG4vKipcbiAqIEhlbHBzICdzZXJpYWxpemUnIHdpdGggc2VyaWFsaXppbmcgYXJyYXlzLlxuICogTXV0YXRlcyB0aGUgcGFpcnMgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcGFpcnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICovXG5cbmZ1bmN0aW9uIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIHZhbCkge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgcmV0dXJuIHZhbC5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcbiAgICAgIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIHYpO1xuICAgIH0pO1xuICB9XG4gIHBhaXJzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSlcbiAgICArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudCh2YWwpKTtcbn1cblxuLyoqXG4gKiBFeHBvc2Ugc2VyaWFsaXphdGlvbiBtZXRob2QuXG4gKi9cblxuIHJlcXVlc3Quc2VyaWFsaXplT2JqZWN0ID0gc2VyaWFsaXplO1xuXG4gLyoqXG4gICogUGFyc2UgdGhlIGdpdmVuIHgtd3d3LWZvcm0tdXJsZW5jb2RlZCBgc3RyYC5cbiAgKlxuICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICogQGFwaSBwcml2YXRlXG4gICovXG5cbmZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cikge1xuICB2YXIgb2JqID0ge307XG4gIHZhciBwYWlycyA9IHN0ci5zcGxpdCgnJicpO1xuICB2YXIgcGFydHM7XG4gIHZhciBwYWlyO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHBhaXIgPSBwYWlyc1tpXTtcbiAgICBwYXJ0cyA9IHBhaXIuc3BsaXQoJz0nKTtcbiAgICBvYmpbZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRzWzBdKV0gPSBkZWNvZGVVUklDb21wb25lbnQocGFydHNbMV0pO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBFeHBvc2UgcGFyc2VyLlxuICovXG5cbnJlcXVlc3QucGFyc2VTdHJpbmcgPSBwYXJzZVN0cmluZztcblxuLyoqXG4gKiBEZWZhdWx0IE1JTUUgdHlwZSBtYXAuXG4gKlxuICogICAgIHN1cGVyYWdlbnQudHlwZXMueG1sID0gJ2FwcGxpY2F0aW9uL3htbCc7XG4gKlxuICovXG5cbnJlcXVlc3QudHlwZXMgPSB7XG4gIGh0bWw6ICd0ZXh0L2h0bWwnLFxuICBqc29uOiAnYXBwbGljYXRpb24vanNvbicsXG4gIHhtbDogJ2FwcGxpY2F0aW9uL3htbCcsXG4gIHVybGVuY29kZWQ6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnLFxuICAnZm9ybSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnLFxuICAnZm9ybS1kYXRhJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbn07XG5cbi8qKlxuICogRGVmYXVsdCBzZXJpYWxpemF0aW9uIG1hcC5cbiAqXG4gKiAgICAgc3VwZXJhZ2VudC5zZXJpYWxpemVbJ2FwcGxpY2F0aW9uL3htbCddID0gZnVuY3Rpb24ob2JqKXtcbiAqICAgICAgIHJldHVybiAnZ2VuZXJhdGVkIHhtbCBoZXJlJztcbiAqICAgICB9O1xuICpcbiAqL1xuXG4gcmVxdWVzdC5zZXJpYWxpemUgPSB7XG4gICAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJzogc2VyaWFsaXplLFxuICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBKU09OLnN0cmluZ2lmeVxuIH07XG5cbiAvKipcbiAgKiBEZWZhdWx0IHBhcnNlcnMuXG4gICpcbiAgKiAgICAgc3VwZXJhZ2VudC5wYXJzZVsnYXBwbGljYXRpb24veG1sJ10gPSBmdW5jdGlvbihzdHIpe1xuICAqICAgICAgIHJldHVybiB7IG9iamVjdCBwYXJzZWQgZnJvbSBzdHIgfTtcbiAgKiAgICAgfTtcbiAgKlxuICAqL1xuXG5yZXF1ZXN0LnBhcnNlID0ge1xuICAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJzogcGFyc2VTdHJpbmcsXG4gICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5wYXJzZVxufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gaGVhZGVyIGBzdHJgIGludG9cbiAqIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBtYXBwZWQgZmllbGRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlSGVhZGVyKHN0cikge1xuICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoL1xccj9cXG4vKTtcbiAgdmFyIGZpZWxkcyA9IHt9O1xuICB2YXIgaW5kZXg7XG4gIHZhciBsaW5lO1xuICB2YXIgZmllbGQ7XG4gIHZhciB2YWw7XG5cbiAgbGluZXMucG9wKCk7IC8vIHRyYWlsaW5nIENSTEZcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBsaW5lID0gbGluZXNbaV07XG4gICAgaW5kZXggPSBsaW5lLmluZGV4T2YoJzonKTtcbiAgICBmaWVsZCA9IGxpbmUuc2xpY2UoMCwgaW5kZXgpLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFsID0gdHJpbShsaW5lLnNsaWNlKGluZGV4ICsgMSkpO1xuICAgIGZpZWxkc1tmaWVsZF0gPSB2YWw7XG4gIH1cblxuICByZXR1cm4gZmllbGRzO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBtaW1lYCBpcyBqc29uIG9yIGhhcyAranNvbiBzdHJ1Y3R1cmVkIHN5bnRheCBzdWZmaXguXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1pbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBpc0pTT04obWltZSkge1xuICByZXR1cm4gL1tcXC8rXWpzb25cXGIvLnRlc3QobWltZSk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBtaW1lIHR5cGUgZm9yIHRoZSBnaXZlbiBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiB0eXBlKHN0cil7XG4gIHJldHVybiBzdHIuc3BsaXQoLyAqOyAqLykuc2hpZnQoKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGhlYWRlciBmaWVsZCBwYXJhbWV0ZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcmFtcyhzdHIpe1xuICByZXR1cm4gcmVkdWNlKHN0ci5zcGxpdCgvICo7ICovKSwgZnVuY3Rpb24ob2JqLCBzdHIpe1xuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvICo9ICovKVxuICAgICAgLCBrZXkgPSBwYXJ0cy5zaGlmdCgpXG4gICAgICAsIHZhbCA9IHBhcnRzLnNoaWZ0KCk7XG5cbiAgICBpZiAoa2V5ICYmIHZhbCkgb2JqW2tleV0gPSB2YWw7XG4gICAgcmV0dXJuIG9iajtcbiAgfSwge30pO1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBSZXNwb25zZWAgd2l0aCB0aGUgZ2l2ZW4gYHhocmAuXG4gKlxuICogIC0gc2V0IGZsYWdzICgub2ssIC5lcnJvciwgZXRjKVxuICogIC0gcGFyc2UgaGVhZGVyXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogIEFsaWFzaW5nIGBzdXBlcmFnZW50YCBhcyBgcmVxdWVzdGAgaXMgbmljZTpcbiAqXG4gKiAgICAgIHJlcXVlc3QgPSBzdXBlcmFnZW50O1xuICpcbiAqICBXZSBjYW4gdXNlIHRoZSBwcm9taXNlLWxpa2UgQVBJLCBvciBwYXNzIGNhbGxiYWNrczpcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvJykuZW5kKGZ1bmN0aW9uKHJlcyl7fSk7XG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvJywgZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiAgU2VuZGluZyBkYXRhIGNhbiBiZSBjaGFpbmVkOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqICBPciBwYXNzZWQgdG8gYC5zZW5kKClgOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0sIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogIE9yIHBhc3NlZCB0byBgLnBvc3QoKWA6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJywgeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqIE9yIGZ1cnRoZXIgcmVkdWNlZCB0byBhIHNpbmdsZSBjYWxsIGZvciBzaW1wbGUgY2FzZXM6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJywgeyBuYW1lOiAndGonIH0sIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogQHBhcmFtIHtYTUxIVFRQUmVxdWVzdH0geGhyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gUmVzcG9uc2UocmVxLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLnJlcSA9IHJlcTtcbiAgdGhpcy54aHIgPSB0aGlzLnJlcS54aHI7XG4gIC8vIHJlc3BvbnNlVGV4dCBpcyBhY2Nlc3NpYmxlIG9ubHkgaWYgcmVzcG9uc2VUeXBlIGlzICcnIG9yICd0ZXh0JyBhbmQgb24gb2xkZXIgYnJvd3NlcnNcbiAgdGhpcy50ZXh0ID0gKCh0aGlzLnJlcS5tZXRob2QgIT0nSEVBRCcgJiYgKHRoaXMueGhyLnJlc3BvbnNlVHlwZSA9PT0gJycgfHwgdGhpcy54aHIucmVzcG9uc2VUeXBlID09PSAndGV4dCcpKSB8fCB0eXBlb2YgdGhpcy54aHIucmVzcG9uc2VUeXBlID09PSAndW5kZWZpbmVkJylcbiAgICAgPyB0aGlzLnhoci5yZXNwb25zZVRleHRcbiAgICAgOiBudWxsO1xuICB0aGlzLnN0YXR1c1RleHQgPSB0aGlzLnJlcS54aHIuc3RhdHVzVGV4dDtcbiAgdGhpcy5zZXRTdGF0dXNQcm9wZXJ0aWVzKHRoaXMueGhyLnN0YXR1cyk7XG4gIHRoaXMuaGVhZGVyID0gdGhpcy5oZWFkZXJzID0gcGFyc2VIZWFkZXIodGhpcy54aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpO1xuICAvLyBnZXRBbGxSZXNwb25zZUhlYWRlcnMgc29tZXRpbWVzIGZhbHNlbHkgcmV0dXJucyBcIlwiIGZvciBDT1JTIHJlcXVlc3RzLCBidXRcbiAgLy8gZ2V0UmVzcG9uc2VIZWFkZXIgc3RpbGwgd29ya3MuIHNvIHdlIGdldCBjb250ZW50LXR5cGUgZXZlbiBpZiBnZXR0aW5nXG4gIC8vIG90aGVyIGhlYWRlcnMgZmFpbHMuXG4gIHRoaXMuaGVhZGVyWydjb250ZW50LXR5cGUnXSA9IHRoaXMueGhyLmdldFJlc3BvbnNlSGVhZGVyKCdjb250ZW50LXR5cGUnKTtcbiAgdGhpcy5zZXRIZWFkZXJQcm9wZXJ0aWVzKHRoaXMuaGVhZGVyKTtcbiAgdGhpcy5ib2R5ID0gdGhpcy5yZXEubWV0aG9kICE9ICdIRUFEJ1xuICAgID8gdGhpcy5wYXJzZUJvZHkodGhpcy50ZXh0ID8gdGhpcy50ZXh0IDogdGhpcy54aHIucmVzcG9uc2UpXG4gICAgOiBudWxsO1xufVxuXG4vKipcbiAqIEdldCBjYXNlLWluc2Vuc2l0aXZlIGBmaWVsZGAgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihmaWVsZCl7XG4gIHJldHVybiB0aGlzLmhlYWRlcltmaWVsZC50b0xvd2VyQ2FzZSgpXTtcbn07XG5cbi8qKlxuICogU2V0IGhlYWRlciByZWxhdGVkIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGAudHlwZWAgdGhlIGNvbnRlbnQgdHlwZSB3aXRob3V0IHBhcmFtc1xuICpcbiAqIEEgcmVzcG9uc2Ugb2YgXCJDb250ZW50LVR5cGU6IHRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIlxuICogd2lsbCBwcm92aWRlIHlvdSB3aXRoIGEgYC50eXBlYCBvZiBcInRleHQvcGxhaW5cIi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaGVhZGVyXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXNwb25zZS5wcm90b3R5cGUuc2V0SGVhZGVyUHJvcGVydGllcyA9IGZ1bmN0aW9uKGhlYWRlcil7XG4gIC8vIGNvbnRlbnQtdHlwZVxuICB2YXIgY3QgPSB0aGlzLmhlYWRlclsnY29udGVudC10eXBlJ10gfHwgJyc7XG4gIHRoaXMudHlwZSA9IHR5cGUoY3QpO1xuXG4gIC8vIHBhcmFtc1xuICB2YXIgb2JqID0gcGFyYW1zKGN0KTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikgdGhpc1trZXldID0gb2JqW2tleV07XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBib2R5IGBzdHJgLlxuICpcbiAqIFVzZWQgZm9yIGF1dG8tcGFyc2luZyBvZiBib2RpZXMuIFBhcnNlcnNcbiAqIGFyZSBkZWZpbmVkIG9uIHRoZSBgc3VwZXJhZ2VudC5wYXJzZWAgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLnBhcnNlQm9keSA9IGZ1bmN0aW9uKHN0cil7XG4gIHZhciBwYXJzZSA9IHJlcXVlc3QucGFyc2VbdGhpcy50eXBlXTtcbiAgaWYgKCFwYXJzZSAmJiBpc0pTT04odGhpcy50eXBlKSkge1xuICAgIHBhcnNlID0gcmVxdWVzdC5wYXJzZVsnYXBwbGljYXRpb24vanNvbiddO1xuICB9XG4gIHJldHVybiBwYXJzZSAmJiBzdHIgJiYgKHN0ci5sZW5ndGggfHwgc3RyIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgID8gcGFyc2Uoc3RyKVxuICAgIDogbnVsbDtcbn07XG5cbi8qKlxuICogU2V0IGZsYWdzIHN1Y2ggYXMgYC5va2AgYmFzZWQgb24gYHN0YXR1c2AuXG4gKlxuICogRm9yIGV4YW1wbGUgYSAyeHggcmVzcG9uc2Ugd2lsbCBnaXZlIHlvdSBhIGAub2tgIG9mIF9fdHJ1ZV9fXG4gKiB3aGVyZWFzIDV4eCB3aWxsIGJlIF9fZmFsc2VfXyBhbmQgYC5lcnJvcmAgd2lsbCBiZSBfX3RydWVfXy4gVGhlXG4gKiBgLmNsaWVudEVycm9yYCBhbmQgYC5zZXJ2ZXJFcnJvcmAgYXJlIGFsc28gYXZhaWxhYmxlIHRvIGJlIG1vcmVcbiAqIHNwZWNpZmljLCBhbmQgYC5zdGF0dXNUeXBlYCBpcyB0aGUgY2xhc3Mgb2YgZXJyb3IgcmFuZ2luZyBmcm9tIDEuLjVcbiAqIHNvbWV0aW1lcyB1c2VmdWwgZm9yIG1hcHBpbmcgcmVzcG9uZCBjb2xvcnMgZXRjLlxuICpcbiAqIFwic3VnYXJcIiBwcm9wZXJ0aWVzIGFyZSBhbHNvIGRlZmluZWQgZm9yIGNvbW1vbiBjYXNlcy4gQ3VycmVudGx5IHByb3ZpZGluZzpcbiAqXG4gKiAgIC0gLm5vQ29udGVudFxuICogICAtIC5iYWRSZXF1ZXN0XG4gKiAgIC0gLnVuYXV0aG9yaXplZFxuICogICAtIC5ub3RBY2NlcHRhYmxlXG4gKiAgIC0gLm5vdEZvdW5kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YXR1c1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLnNldFN0YXR1c1Byb3BlcnRpZXMgPSBmdW5jdGlvbihzdGF0dXMpe1xuICAvLyBoYW5kbGUgSUU5IGJ1ZzogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDA0Njk3Mi9tc2llLXJldHVybnMtc3RhdHVzLWNvZGUtb2YtMTIyMy1mb3ItYWpheC1yZXF1ZXN0XG4gIGlmIChzdGF0dXMgPT09IDEyMjMpIHtcbiAgICBzdGF0dXMgPSAyMDQ7XG4gIH1cblxuICB2YXIgdHlwZSA9IHN0YXR1cyAvIDEwMCB8IDA7XG5cbiAgLy8gc3RhdHVzIC8gY2xhc3NcbiAgdGhpcy5zdGF0dXMgPSB0aGlzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XG4gIHRoaXMuc3RhdHVzVHlwZSA9IHR5cGU7XG5cbiAgLy8gYmFzaWNzXG4gIHRoaXMuaW5mbyA9IDEgPT0gdHlwZTtcbiAgdGhpcy5vayA9IDIgPT0gdHlwZTtcbiAgdGhpcy5jbGllbnRFcnJvciA9IDQgPT0gdHlwZTtcbiAgdGhpcy5zZXJ2ZXJFcnJvciA9IDUgPT0gdHlwZTtcbiAgdGhpcy5lcnJvciA9ICg0ID09IHR5cGUgfHwgNSA9PSB0eXBlKVxuICAgID8gdGhpcy50b0Vycm9yKClcbiAgICA6IGZhbHNlO1xuXG4gIC8vIHN1Z2FyXG4gIHRoaXMuYWNjZXB0ZWQgPSAyMDIgPT0gc3RhdHVzO1xuICB0aGlzLm5vQ29udGVudCA9IDIwNCA9PSBzdGF0dXM7XG4gIHRoaXMuYmFkUmVxdWVzdCA9IDQwMCA9PSBzdGF0dXM7XG4gIHRoaXMudW5hdXRob3JpemVkID0gNDAxID09IHN0YXR1cztcbiAgdGhpcy5ub3RBY2NlcHRhYmxlID0gNDA2ID09IHN0YXR1cztcbiAgdGhpcy5ub3RGb3VuZCA9IDQwNCA9PSBzdGF0dXM7XG4gIHRoaXMuZm9yYmlkZGVuID0gNDAzID09IHN0YXR1cztcbn07XG5cbi8qKlxuICogUmV0dXJuIGFuIGBFcnJvcmAgcmVwcmVzZW50YXRpdmUgb2YgdGhpcyByZXNwb25zZS5cbiAqXG4gKiBAcmV0dXJuIHtFcnJvcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLnRvRXJyb3IgPSBmdW5jdGlvbigpe1xuICB2YXIgcmVxID0gdGhpcy5yZXE7XG4gIHZhciBtZXRob2QgPSByZXEubWV0aG9kO1xuICB2YXIgdXJsID0gcmVxLnVybDtcblxuICB2YXIgbXNnID0gJ2Nhbm5vdCAnICsgbWV0aG9kICsgJyAnICsgdXJsICsgJyAoJyArIHRoaXMuc3RhdHVzICsgJyknO1xuICB2YXIgZXJyID0gbmV3IEVycm9yKG1zZyk7XG4gIGVyci5zdGF0dXMgPSB0aGlzLnN0YXR1cztcbiAgZXJyLm1ldGhvZCA9IG1ldGhvZDtcbiAgZXJyLnVybCA9IHVybDtcblxuICByZXR1cm4gZXJyO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYFJlc3BvbnNlYC5cbiAqL1xuXG5yZXF1ZXN0LlJlc3BvbnNlID0gUmVzcG9uc2U7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgUmVxdWVzdGAgd2l0aCB0aGUgZ2l2ZW4gYG1ldGhvZGAgYW5kIGB1cmxgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gUmVxdWVzdChtZXRob2QsIHVybCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuX3F1ZXJ5ID0gdGhpcy5fcXVlcnkgfHwgW107XG4gIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICB0aGlzLnVybCA9IHVybDtcbiAgdGhpcy5oZWFkZXIgPSB7fTsgLy8gcHJlc2VydmVzIGhlYWRlciBuYW1lIGNhc2VcbiAgdGhpcy5faGVhZGVyID0ge307IC8vIGNvZXJjZXMgaGVhZGVyIG5hbWVzIHRvIGxvd2VyY2FzZVxuICB0aGlzLm9uKCdlbmQnLCBmdW5jdGlvbigpe1xuICAgIHZhciBlcnIgPSBudWxsO1xuICAgIHZhciByZXMgPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlcyA9IG5ldyBSZXNwb25zZShzZWxmKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGVyciA9IG5ldyBFcnJvcignUGFyc2VyIGlzIHVuYWJsZSB0byBwYXJzZSB0aGUgcmVzcG9uc2UnKTtcbiAgICAgIGVyci5wYXJzZSA9IHRydWU7XG4gICAgICBlcnIub3JpZ2luYWwgPSBlO1xuICAgICAgLy8gaXNzdWUgIzY3NTogcmV0dXJuIHRoZSByYXcgcmVzcG9uc2UgaWYgdGhlIHJlc3BvbnNlIHBhcnNpbmcgZmFpbHNcbiAgICAgIGVyci5yYXdSZXNwb25zZSA9IHNlbGYueGhyICYmIHNlbGYueGhyLnJlc3BvbnNlVGV4dCA/IHNlbGYueGhyLnJlc3BvbnNlVGV4dCA6IG51bGw7XG4gICAgICAvLyBpc3N1ZSAjODc2OiByZXR1cm4gdGhlIGh0dHAgc3RhdHVzIGNvZGUgaWYgdGhlIHJlc3BvbnNlIHBhcnNpbmcgZmFpbHNcbiAgICAgIGVyci5zdGF0dXNDb2RlID0gc2VsZi54aHIgJiYgc2VsZi54aHIuc3RhdHVzID8gc2VsZi54aHIuc3RhdHVzIDogbnVsbDtcbiAgICAgIHJldHVybiBzZWxmLmNhbGxiYWNrKGVycik7XG4gICAgfVxuXG4gICAgc2VsZi5lbWl0KCdyZXNwb25zZScsIHJlcyk7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gc2VsZi5jYWxsYmFjayhlcnIsIHJlcyk7XG4gICAgfVxuXG4gICAgaWYgKHJlcy5zdGF0dXMgPj0gMjAwICYmIHJlcy5zdGF0dXMgPCAzMDApIHtcbiAgICAgIHJldHVybiBzZWxmLmNhbGxiYWNrKGVyciwgcmVzKTtcbiAgICB9XG5cbiAgICB2YXIgbmV3X2VyciA9IG5ldyBFcnJvcihyZXMuc3RhdHVzVGV4dCB8fCAnVW5zdWNjZXNzZnVsIEhUVFAgcmVzcG9uc2UnKTtcbiAgICBuZXdfZXJyLm9yaWdpbmFsID0gZXJyO1xuICAgIG5ld19lcnIucmVzcG9uc2UgPSByZXM7XG4gICAgbmV3X2Vyci5zdGF0dXMgPSByZXMuc3RhdHVzO1xuXG4gICAgc2VsZi5jYWxsYmFjayhuZXdfZXJyLCByZXMpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBNaXhpbiBgRW1pdHRlcmAgYW5kIGByZXF1ZXN0QmFzZWAuXG4gKi9cblxuRW1pdHRlcihSZXF1ZXN0LnByb3RvdHlwZSk7XG5mb3IgKHZhciBrZXkgaW4gcmVxdWVzdEJhc2UpIHtcbiAgUmVxdWVzdC5wcm90b3R5cGVba2V5XSA9IHJlcXVlc3RCYXNlW2tleV07XG59XG5cbi8qKlxuICogQWJvcnQgdGhlIHJlcXVlc3QsIGFuZCBjbGVhciBwb3RlbnRpYWwgdGltZW91dC5cbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uKCl7XG4gIGlmICh0aGlzLmFib3J0ZWQpIHJldHVybjtcbiAgdGhpcy5hYm9ydGVkID0gdHJ1ZTtcbiAgdGhpcy54aHIuYWJvcnQoKTtcbiAgdGhpcy5jbGVhclRpbWVvdXQoKTtcbiAgdGhpcy5lbWl0KCdhYm9ydCcpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IENvbnRlbnQtVHlwZSB0byBgdHlwZWAsIG1hcHBpbmcgdmFsdWVzIGZyb20gYHJlcXVlc3QudHlwZXNgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgc3VwZXJhZ2VudC50eXBlcy54bWwgPSAnYXBwbGljYXRpb24veG1sJztcbiAqXG4gKiAgICAgIHJlcXVlc3QucG9zdCgnLycpXG4gKiAgICAgICAgLnR5cGUoJ3htbCcpXG4gKiAgICAgICAgLnNlbmQoeG1sc3RyaW5nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5wb3N0KCcvJylcbiAqICAgICAgICAudHlwZSgnYXBwbGljYXRpb24veG1sJylcbiAqICAgICAgICAuc2VuZCh4bWxzdHJpbmcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24odHlwZSl7XG4gIHRoaXMuc2V0KCdDb250ZW50LVR5cGUnLCByZXF1ZXN0LnR5cGVzW3R5cGVdIHx8IHR5cGUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHJlc3BvbnNlVHlwZSB0byBgdmFsYC4gUHJlc2VudGx5IHZhbGlkIHJlc3BvbnNlVHlwZXMgYXJlICdibG9iJyBhbmQgXG4gKiAnYXJyYXlidWZmZXInLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgcmVxLmdldCgnLycpXG4gKiAgICAgICAgLnJlc3BvbnNlVHlwZSgnYmxvYicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnJlc3BvbnNlVHlwZSA9IGZ1bmN0aW9uKHZhbCl7XG4gIHRoaXMuX3Jlc3BvbnNlVHlwZSA9IHZhbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCBBY2NlcHQgdG8gYHR5cGVgLCBtYXBwaW5nIHZhbHVlcyBmcm9tIGByZXF1ZXN0LnR5cGVzYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHN1cGVyYWdlbnQudHlwZXMuanNvbiA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvYWdlbnQnKVxuICogICAgICAgIC5hY2NlcHQoJ2pzb24nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy9hZ2VudCcpXG4gKiAgICAgICAgLmFjY2VwdCgnYXBwbGljYXRpb24vanNvbicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFjY2VwdFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uKHR5cGUpe1xuICB0aGlzLnNldCgnQWNjZXB0JywgcmVxdWVzdC50eXBlc1t0eXBlXSB8fCB0eXBlKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCBBdXRob3JpemF0aW9uIGZpZWxkIHZhbHVlIHdpdGggYHVzZXJgIGFuZCBgcGFzc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXNzXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyB3aXRoICd0eXBlJyBwcm9wZXJ0eSAnYXV0bycgb3IgJ2Jhc2ljJyAoZGVmYXVsdCAnYmFzaWMnKVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmF1dGggPSBmdW5jdGlvbih1c2VyLCBwYXNzLCBvcHRpb25zKXtcbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIHR5cGU6ICdiYXNpYydcbiAgICB9XG4gIH1cblxuICBzd2l0Y2ggKG9wdGlvbnMudHlwZSkge1xuICAgIGNhc2UgJ2Jhc2ljJzpcbiAgICAgIHZhciBzdHIgPSBidG9hKHVzZXIgKyAnOicgKyBwYXNzKTtcbiAgICAgIHRoaXMuc2V0KCdBdXRob3JpemF0aW9uJywgJ0Jhc2ljICcgKyBzdHIpO1xuICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnYXV0byc6XG4gICAgICB0aGlzLnVzZXJuYW1lID0gdXNlcjtcbiAgICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzO1xuICAgIGJyZWFrO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4qIEFkZCBxdWVyeS1zdHJpbmcgYHZhbGAuXG4qXG4qIEV4YW1wbGVzOlxuKlxuKiAgIHJlcXVlc3QuZ2V0KCcvc2hvZXMnKVxuKiAgICAgLnF1ZXJ5KCdzaXplPTEwJylcbiogICAgIC5xdWVyeSh7IGNvbG9yOiAnYmx1ZScgfSlcbipcbiogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YWxcbiogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4qIEBhcGkgcHVibGljXG4qL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uKHZhbCl7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgdmFsKSB2YWwgPSBzZXJpYWxpemUodmFsKTtcbiAgaWYgKHZhbCkgdGhpcy5fcXVlcnkucHVzaCh2YWwpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUXVldWUgdGhlIGdpdmVuIGBmaWxlYCBhcyBhbiBhdHRhY2htZW50IHRvIHRoZSBzcGVjaWZpZWQgYGZpZWxkYCxcbiAqIHdpdGggb3B0aW9uYWwgYGZpbGVuYW1lYC5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QucG9zdCgnL3VwbG9hZCcpXG4gKiAgIC5hdHRhY2gobmV3IEJsb2IoWyc8YSBpZD1cImFcIj48YiBpZD1cImJcIj5oZXkhPC9iPjwvYT4nXSwgeyB0eXBlOiBcInRleHQvaHRtbFwifSkpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcGFyYW0ge0Jsb2J8RmlsZX0gZmlsZVxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24oZmllbGQsIGZpbGUsIGZpbGVuYW1lKXtcbiAgdGhpcy5fZ2V0Rm9ybURhdGEoKS5hcHBlbmQoZmllbGQsIGZpbGUsIGZpbGVuYW1lIHx8IGZpbGUubmFtZSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUmVxdWVzdC5wcm90b3R5cGUuX2dldEZvcm1EYXRhID0gZnVuY3Rpb24oKXtcbiAgaWYgKCF0aGlzLl9mb3JtRGF0YSkge1xuICAgIHRoaXMuX2Zvcm1EYXRhID0gbmV3IHJvb3QuRm9ybURhdGEoKTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZm9ybURhdGE7XG59O1xuXG4vKipcbiAqIFNlbmQgYGRhdGFgIGFzIHRoZSByZXF1ZXN0IGJvZHksIGRlZmF1bHRpbmcgdGhlIGAudHlwZSgpYCB0byBcImpzb25cIiB3aGVuXG4gKiBhbiBvYmplY3QgaXMgZ2l2ZW4uXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICAgLy8gbWFudWFsIGpzb25cbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAudHlwZSgnanNvbicpXG4gKiAgICAgICAgIC5zZW5kKCd7XCJuYW1lXCI6XCJ0alwifScpXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gYXV0byBqc29uXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gbWFudWFsIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICogICAgICAgcmVxdWVzdC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgIC50eXBlKCdmb3JtJylcbiAqICAgICAgICAgLnNlbmQoJ25hbWU9dGonKVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIGF1dG8geC13d3ctZm9ybS11cmxlbmNvZGVkXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnR5cGUoJ2Zvcm0nKVxuICogICAgICAgICAuc2VuZCh7IG5hbWU6ICd0aicgfSlcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBkZWZhdWx0cyB0byB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgKiAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICAqICAgICAgICAuc2VuZCgnbmFtZT10b2JpJylcbiAgKiAgICAgICAgLnNlbmQoJ3NwZWNpZXM9ZmVycmV0JylcbiAgKiAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGRhdGFcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oZGF0YSl7XG4gIHZhciBvYmogPSBpc09iamVjdChkYXRhKTtcbiAgdmFyIHR5cGUgPSB0aGlzLl9oZWFkZXJbJ2NvbnRlbnQtdHlwZSddO1xuXG4gIC8vIG1lcmdlXG4gIGlmIChvYmogJiYgaXNPYmplY3QodGhpcy5fZGF0YSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgdGhpcy5fZGF0YVtrZXldID0gZGF0YVtrZXldO1xuICAgIH1cbiAgfSBlbHNlIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgZGF0YSkge1xuICAgIGlmICghdHlwZSkgdGhpcy50eXBlKCdmb3JtJyk7XG4gICAgdHlwZSA9IHRoaXMuX2hlYWRlclsnY29udGVudC10eXBlJ107XG4gICAgaWYgKCdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnID09IHR5cGUpIHtcbiAgICAgIHRoaXMuX2RhdGEgPSB0aGlzLl9kYXRhXG4gICAgICAgID8gdGhpcy5fZGF0YSArICcmJyArIGRhdGFcbiAgICAgICAgOiBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kYXRhID0gKHRoaXMuX2RhdGEgfHwgJycpICsgZGF0YTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gIH1cblxuICBpZiAoIW9iaiB8fCBpc0hvc3QoZGF0YSkpIHJldHVybiB0aGlzO1xuICBpZiAoIXR5cGUpIHRoaXMudHlwZSgnanNvbicpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqL1xuUmVzcG9uc2UucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gc2VyaWFsaXplKGZuKXtcbiAgaWYgKHJvb3QuY29uc29sZSkge1xuICAgIGNvbnNvbGUud2FybihcIkNsaWVudC1zaWRlIHBhcnNlKCkgbWV0aG9kIGhhcyBiZWVuIHJlbmFtZWQgdG8gc2VyaWFsaXplKCkuIFRoaXMgbWV0aG9kIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggc3VwZXJhZ2VudCB2Mi4wXCIpO1xuICB9XG4gIHRoaXMuc2VyaWFsaXplKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZXNwb25zZS5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24gc2VyaWFsaXplKGZuKXtcbiAgdGhpcy5fcGFyc2VyID0gZm47XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbnZva2UgdGhlIGNhbGxiYWNrIHdpdGggYGVycmAgYW5kIGByZXNgXG4gKiBhbmQgaGFuZGxlIGFyaXR5IGNoZWNrLlxuICpcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICogQHBhcmFtIHtSZXNwb25zZX0gcmVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5jYWxsYmFjayA9IGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgdmFyIGZuID0gdGhpcy5fY2FsbGJhY2s7XG4gIHRoaXMuY2xlYXJUaW1lb3V0KCk7XG4gIGZuKGVyciwgcmVzKTtcbn07XG5cbi8qKlxuICogSW52b2tlIGNhbGxiYWNrIHdpdGggeC1kb21haW4gZXJyb3IuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY3Jvc3NEb21haW5FcnJvciA9IGZ1bmN0aW9uKCl7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1JlcXVlc3QgaGFzIGJlZW4gdGVybWluYXRlZFxcblBvc3NpYmxlIGNhdXNlczogdGhlIG5ldHdvcmsgaXMgb2ZmbGluZSwgT3JpZ2luIGlzIG5vdCBhbGxvd2VkIGJ5IEFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbiwgdGhlIHBhZ2UgaXMgYmVpbmcgdW5sb2FkZWQsIGV0Yy4nKTtcbiAgZXJyLmNyb3NzRG9tYWluID0gdHJ1ZTtcblxuICBlcnIuc3RhdHVzID0gdGhpcy5zdGF0dXM7XG4gIGVyci5tZXRob2QgPSB0aGlzLm1ldGhvZDtcbiAgZXJyLnVybCA9IHRoaXMudXJsO1xuXG4gIHRoaXMuY2FsbGJhY2soZXJyKTtcbn07XG5cbi8qKlxuICogSW52b2tlIGNhbGxiYWNrIHdpdGggdGltZW91dCBlcnJvci5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS50aW1lb3V0RXJyb3IgPSBmdW5jdGlvbigpe1xuICB2YXIgdGltZW91dCA9IHRoaXMuX3RpbWVvdXQ7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IoJ3RpbWVvdXQgb2YgJyArIHRpbWVvdXQgKyAnbXMgZXhjZWVkZWQnKTtcbiAgZXJyLnRpbWVvdXQgPSB0aW1lb3V0O1xuICB0aGlzLmNhbGxiYWNrKGVycik7XG59O1xuXG4vKipcbiAqIEVuYWJsZSB0cmFuc21pc3Npb24gb2YgY29va2llcyB3aXRoIHgtZG9tYWluIHJlcXVlc3RzLlxuICpcbiAqIE5vdGUgdGhhdCBmb3IgdGhpcyB0byB3b3JrIHRoZSBvcmlnaW4gbXVzdCBub3QgYmVcbiAqIHVzaW5nIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIgd2l0aCBhIHdpbGRjYXJkLFxuICogYW5kIGFsc28gbXVzdCBzZXQgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFsc1wiXG4gKiB0byBcInRydWVcIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLndpdGhDcmVkZW50aWFscyA9IGZ1bmN0aW9uKCl7XG4gIHRoaXMuX3dpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbml0aWF0ZSByZXF1ZXN0LCBpbnZva2luZyBjYWxsYmFjayBgZm4ocmVzKWBcbiAqIHdpdGggYW4gaW5zdGFuY2VvZiBgUmVzcG9uc2VgLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oZm4pe1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciB4aHIgPSB0aGlzLnhociA9IHJlcXVlc3QuZ2V0WEhSKCk7XG4gIHZhciBxdWVyeSA9IHRoaXMuX3F1ZXJ5LmpvaW4oJyYnKTtcbiAgdmFyIHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICB2YXIgZGF0YSA9IHRoaXMuX2Zvcm1EYXRhIHx8IHRoaXMuX2RhdGE7XG5cbiAgLy8gc3RvcmUgY2FsbGJhY2tcbiAgdGhpcy5fY2FsbGJhY2sgPSBmbiB8fCBub29wO1xuXG4gIC8vIHN0YXRlIGNoYW5nZVxuICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKXtcbiAgICBpZiAoNCAhPSB4aHIucmVhZHlTdGF0ZSkgcmV0dXJuO1xuXG4gICAgLy8gSW4gSUU5LCByZWFkcyB0byBhbnkgcHJvcGVydHkgKGUuZy4gc3RhdHVzKSBvZmYgb2YgYW4gYWJvcnRlZCBYSFIgd2lsbFxuICAgIC8vIHJlc3VsdCBpbiB0aGUgZXJyb3IgXCJDb3VsZCBub3QgY29tcGxldGUgdGhlIG9wZXJhdGlvbiBkdWUgdG8gZXJyb3IgYzAwYzAyM2ZcIlxuICAgIHZhciBzdGF0dXM7XG4gICAgdHJ5IHsgc3RhdHVzID0geGhyLnN0YXR1cyB9IGNhdGNoKGUpIHsgc3RhdHVzID0gMDsgfVxuXG4gICAgaWYgKDAgPT0gc3RhdHVzKSB7XG4gICAgICBpZiAoc2VsZi50aW1lZG91dCkgcmV0dXJuIHNlbGYudGltZW91dEVycm9yKCk7XG4gICAgICBpZiAoc2VsZi5hYm9ydGVkKSByZXR1cm47XG4gICAgICByZXR1cm4gc2VsZi5jcm9zc0RvbWFpbkVycm9yKCk7XG4gICAgfVxuICAgIHNlbGYuZW1pdCgnZW5kJyk7XG4gIH07XG5cbiAgLy8gcHJvZ3Jlc3NcbiAgdmFyIGhhbmRsZVByb2dyZXNzID0gZnVuY3Rpb24oZSl7XG4gICAgaWYgKGUudG90YWwgPiAwKSB7XG4gICAgICBlLnBlcmNlbnQgPSBlLmxvYWRlZCAvIGUudG90YWwgKiAxMDA7XG4gICAgfVxuICAgIGUuZGlyZWN0aW9uID0gJ2Rvd25sb2FkJztcbiAgICBzZWxmLmVtaXQoJ3Byb2dyZXNzJywgZSk7XG4gIH07XG4gIGlmICh0aGlzLmhhc0xpc3RlbmVycygncHJvZ3Jlc3MnKSkge1xuICAgIHhoci5vbnByb2dyZXNzID0gaGFuZGxlUHJvZ3Jlc3M7XG4gIH1cbiAgdHJ5IHtcbiAgICBpZiAoeGhyLnVwbG9hZCAmJiB0aGlzLmhhc0xpc3RlbmVycygncHJvZ3Jlc3MnKSkge1xuICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gaGFuZGxlUHJvZ3Jlc3M7XG4gICAgfVxuICB9IGNhdGNoKGUpIHtcbiAgICAvLyBBY2Nlc3NpbmcgeGhyLnVwbG9hZCBmYWlscyBpbiBJRSBmcm9tIGEgd2ViIHdvcmtlciwgc28ganVzdCBwcmV0ZW5kIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAgLy8gUmVwb3J0ZWQgaGVyZTpcbiAgICAvLyBodHRwczovL2Nvbm5lY3QubWljcm9zb2Z0LmNvbS9JRS9mZWVkYmFjay9kZXRhaWxzLzgzNzI0NS94bWxodHRwcmVxdWVzdC11cGxvYWQtdGhyb3dzLWludmFsaWQtYXJndW1lbnQtd2hlbi11c2VkLWZyb20td2ViLXdvcmtlci1jb250ZXh0XG4gIH1cblxuICAvLyB0aW1lb3V0XG4gIGlmICh0aW1lb3V0ICYmICF0aGlzLl90aW1lcikge1xuICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgc2VsZi50aW1lZG91dCA9IHRydWU7XG4gICAgICBzZWxmLmFib3J0KCk7XG4gICAgfSwgdGltZW91dCk7XG4gIH1cblxuICAvLyBxdWVyeXN0cmluZ1xuICBpZiAocXVlcnkpIHtcbiAgICBxdWVyeSA9IHJlcXVlc3Quc2VyaWFsaXplT2JqZWN0KHF1ZXJ5KTtcbiAgICB0aGlzLnVybCArPSB+dGhpcy51cmwuaW5kZXhPZignPycpXG4gICAgICA/ICcmJyArIHF1ZXJ5XG4gICAgICA6ICc/JyArIHF1ZXJ5O1xuICB9XG5cbiAgLy8gaW5pdGlhdGUgcmVxdWVzdFxuICBpZiAodGhpcy51c2VybmFtZSAmJiB0aGlzLnBhc3N3b3JkKSB7XG4gICAgeGhyLm9wZW4odGhpcy5tZXRob2QsIHRoaXMudXJsLCB0cnVlLCB0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgfSBlbHNlIHtcbiAgICB4aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmwsIHRydWUpO1xuICB9XG5cbiAgLy8gQ09SU1xuICBpZiAodGhpcy5fd2l0aENyZWRlbnRpYWxzKSB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcblxuICAvLyBib2R5XG4gIGlmICgnR0VUJyAhPSB0aGlzLm1ldGhvZCAmJiAnSEVBRCcgIT0gdGhpcy5tZXRob2QgJiYgJ3N0cmluZycgIT0gdHlwZW9mIGRhdGEgJiYgIWlzSG9zdChkYXRhKSkge1xuICAgIC8vIHNlcmlhbGl6ZSBzdHVmZlxuICAgIHZhciBjb250ZW50VHlwZSA9IHRoaXMuX2hlYWRlclsnY29udGVudC10eXBlJ107XG4gICAgdmFyIHNlcmlhbGl6ZSA9IHRoaXMuX3BhcnNlciB8fCByZXF1ZXN0LnNlcmlhbGl6ZVtjb250ZW50VHlwZSA/IGNvbnRlbnRUeXBlLnNwbGl0KCc7JylbMF0gOiAnJ107XG4gICAgaWYgKCFzZXJpYWxpemUgJiYgaXNKU09OKGNvbnRlbnRUeXBlKSkgc2VyaWFsaXplID0gcmVxdWVzdC5zZXJpYWxpemVbJ2FwcGxpY2F0aW9uL2pzb24nXTtcbiAgICBpZiAoc2VyaWFsaXplKSBkYXRhID0gc2VyaWFsaXplKGRhdGEpO1xuICB9XG5cbiAgLy8gc2V0IGhlYWRlciBmaWVsZHNcbiAgZm9yICh2YXIgZmllbGQgaW4gdGhpcy5oZWFkZXIpIHtcbiAgICBpZiAobnVsbCA9PSB0aGlzLmhlYWRlcltmaWVsZF0pIGNvbnRpbnVlO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGZpZWxkLCB0aGlzLmhlYWRlcltmaWVsZF0pO1xuICB9XG5cbiAgaWYgKHRoaXMuX3Jlc3BvbnNlVHlwZSkge1xuICAgIHhoci5yZXNwb25zZVR5cGUgPSB0aGlzLl9yZXNwb25zZVR5cGU7XG4gIH1cblxuICAvLyBzZW5kIHN0dWZmXG4gIHRoaXMuZW1pdCgncmVxdWVzdCcsIHRoaXMpO1xuXG4gIC8vIElFMTEgeGhyLnNlbmQodW5kZWZpbmVkKSBzZW5kcyAndW5kZWZpbmVkJyBzdHJpbmcgYXMgUE9TVCBwYXlsb2FkIChpbnN0ZWFkIG9mIG5vdGhpbmcpXG4gIC8vIFdlIG5lZWQgbnVsbCBoZXJlIGlmIGRhdGEgaXMgdW5kZWZpbmVkXG4gIHhoci5zZW5kKHR5cGVvZiBkYXRhICE9PSAndW5kZWZpbmVkJyA/IGRhdGEgOiBudWxsKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogRXhwb3NlIGBSZXF1ZXN0YC5cbiAqL1xuXG5yZXF1ZXN0LlJlcXVlc3QgPSBSZXF1ZXN0O1xuXG4vKipcbiAqIEdFVCBgdXJsYCB3aXRoIG9wdGlvbmFsIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfEZ1bmN0aW9ufSBkYXRhIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5nZXQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ0dFVCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnF1ZXJ5KGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBIRUFEIGB1cmxgIHdpdGggb3B0aW9uYWwgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR8RnVuY3Rpb259IGRhdGEgb3IgZm5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LmhlYWQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ0hFQUQnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBERUxFVEUgYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlbCh1cmwsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ0RFTEVURScsIHVybCk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG5yZXF1ZXN0WydkZWwnXSA9IGRlbDtcbnJlcXVlc3RbJ2RlbGV0ZSddID0gZGVsO1xuXG4vKipcbiAqIFBBVENIIGB1cmxgIHdpdGggb3B0aW9uYWwgYGRhdGFgIGFuZCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZH0gZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QucGF0Y2ggPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BBVENIJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogUE9TVCBgdXJsYCB3aXRoIG9wdGlvbmFsIGBkYXRhYCBhbmQgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR9IGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LnBvc3QgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BPU1QnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBQVVQgYHVybGAgd2l0aCBvcHRpb25hbCBgZGF0YWAgYW5kIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfEZ1bmN0aW9ufSBkYXRhIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5wdXQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BVVCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuIiwiLyoqXG4gKiBDaGVjayBpZiBgb2JqYCBpcyBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICByZXR1cm4gbnVsbCAhPSBvYmogJiYgJ29iamVjdCcgPT0gdHlwZW9mIG9iajtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsIi8qKlxuICogTW9kdWxlIG9mIG1peGVkLWluIGZ1bmN0aW9ucyBzaGFyZWQgYmV0d2VlbiBub2RlIGFuZCBjbGllbnQgY29kZVxuICovXG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzLW9iamVjdCcpO1xuXG4vKipcbiAqIENsZWFyIHByZXZpb3VzIHRpbWVvdXQuXG4gKlxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID0gZnVuY3Rpb24gX2NsZWFyVGltZW91dCgpe1xuICB0aGlzLl90aW1lb3V0ID0gMDtcbiAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEZvcmNlIGdpdmVuIHBhcnNlclxuICpcbiAqIFNldHMgdGhlIGJvZHkgcGFyc2VyIG5vIG1hdHRlciB0eXBlLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiBwYXJzZShmbil7XG4gIHRoaXMuX3BhcnNlciA9IGZuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHRpbWVvdXQgdG8gYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnRpbWVvdXQgPSBmdW5jdGlvbiB0aW1lb3V0KG1zKXtcbiAgdGhpcy5fdGltZW91dCA9IG1zO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRmF1eCBwcm9taXNlIHN1cHBvcnRcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdWxmaWxsXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWplY3RcbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKi9cblxuZXhwb3J0cy50aGVuID0gZnVuY3Rpb24gdGhlbihmdWxmaWxsLCByZWplY3QpIHtcbiAgcmV0dXJuIHRoaXMuZW5kKGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgZXJyID8gcmVqZWN0KGVycikgOiBmdWxmaWxsKHJlcyk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEFsbG93IGZvciBleHRlbnNpb25cbiAqL1xuXG5leHBvcnRzLnVzZSA9IGZ1bmN0aW9uIHVzZShmbikge1xuICBmbih0aGlzKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cblxuLyoqXG4gKiBHZXQgcmVxdWVzdCBoZWFkZXIgYGZpZWxkYC5cbiAqIENhc2UtaW5zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuZ2V0ID0gZnVuY3Rpb24oZmllbGQpe1xuICByZXR1cm4gdGhpcy5faGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldO1xufTtcblxuLyoqXG4gKiBHZXQgY2FzZS1pbnNlbnNpdGl2ZSBoZWFkZXIgYGZpZWxkYCB2YWx1ZS5cbiAqIFRoaXMgaXMgYSBkZXByZWNhdGVkIGludGVybmFsIEFQSS4gVXNlIGAuZ2V0KGZpZWxkKWAgaW5zdGVhZC5cbiAqXG4gKiAoZ2V0SGVhZGVyIGlzIG5vIGxvbmdlciB1c2VkIGludGVybmFsbHkgYnkgdGhlIHN1cGVyYWdlbnQgY29kZSBiYXNlKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKiBAZGVwcmVjYXRlZFxuICovXG5cbmV4cG9ydHMuZ2V0SGVhZGVyID0gZXhwb3J0cy5nZXQ7XG5cbi8qKlxuICogU2V0IGhlYWRlciBgZmllbGRgIHRvIGB2YWxgLCBvciBtdWx0aXBsZSBmaWVsZHMgd2l0aCBvbmUgb2JqZWN0LlxuICogQ2FzZS1pbnNlbnNpdGl2ZS5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuc2V0KCdYLUFQSS1LZXknLCAnZm9vYmFyJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoeyBBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJywgJ1gtQVBJLUtleSc6ICdmb29iYXInIH0pXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBmaWVsZFxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuc2V0ID0gZnVuY3Rpb24oZmllbGQsIHZhbCl7XG4gIGlmIChpc09iamVjdChmaWVsZCkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gZmllbGQpIHtcbiAgICAgIHRoaXMuc2V0KGtleSwgZmllbGRba2V5XSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHRoaXMuX2hlYWRlcltmaWVsZC50b0xvd2VyQ2FzZSgpXSA9IHZhbDtcbiAgdGhpcy5oZWFkZXJbZmllbGRdID0gdmFsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGhlYWRlciBgZmllbGRgLlxuICogQ2FzZS1pbnNlbnNpdGl2ZS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICAgcmVxLmdldCgnLycpXG4gKiAgICAgICAgLnVuc2V0KCdVc2VyLUFnZW50JylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqL1xuZXhwb3J0cy51bnNldCA9IGZ1bmN0aW9uKGZpZWxkKXtcbiAgZGVsZXRlIHRoaXMuX2hlYWRlcltmaWVsZC50b0xvd2VyQ2FzZSgpXTtcbiAgZGVsZXRlIHRoaXMuaGVhZGVyW2ZpZWxkXTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFdyaXRlIHRoZSBmaWVsZCBgbmFtZWAgYW5kIGB2YWxgIGZvciBcIm11bHRpcGFydC9mb3JtLWRhdGFcIlxuICogcmVxdWVzdCBib2RpZXMuXG4gKlxuICogYGBgIGpzXG4gKiByZXF1ZXN0LnBvc3QoJy91cGxvYWQnKVxuICogICAuZmllbGQoJ2ZvbycsICdiYXInKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ3xCbG9ifEZpbGV8QnVmZmVyfGZzLlJlYWRTdHJlYW19IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnRzLmZpZWxkID0gZnVuY3Rpb24obmFtZSwgdmFsKSB7XG4gIHRoaXMuX2dldEZvcm1EYXRhKCkuYXBwZW5kKG5hbWUsIHZhbCk7XG4gIHJldHVybiB0aGlzO1xufTtcbiIsIi8vIFRoZSBub2RlIGFuZCBicm93c2VyIG1vZHVsZXMgZXhwb3NlIHZlcnNpb25zIG9mIHRoaXMgd2l0aCB0aGVcbi8vIGFwcHJvcHJpYXRlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGJvdW5kIGFzIGZpcnN0IGFyZ3VtZW50XG4vKipcbiAqIElzc3VlIGEgcmVxdWVzdDpcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICByZXF1ZXN0KCdHRVQnLCAnL3VzZXJzJykuZW5kKGNhbGxiYWNrKVxuICogICAgcmVxdWVzdCgnL3VzZXJzJykuZW5kKGNhbGxiYWNrKVxuICogICAgcmVxdWVzdCgnL3VzZXJzJywgY2FsbGJhY2spXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHVybCBvciBjYWxsYmFja1xuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gcmVxdWVzdChSZXF1ZXN0Q29uc3RydWN0b3IsIG1ldGhvZCwgdXJsKSB7XG4gIC8vIGNhbGxiYWNrXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiB1cmwpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3RDb25zdHJ1Y3RvcignR0VUJywgbWV0aG9kKS5lbmQodXJsKTtcbiAgfVxuXG4gIC8vIHVybCBmaXJzdFxuICBpZiAoMiA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0Q29uc3RydWN0b3IoJ0dFVCcsIG1ldGhvZCk7XG4gIH1cblxuICByZXR1cm4gbmV3IFJlcXVlc3RDb25zdHJ1Y3RvcihtZXRob2QsIHVybCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWVzdDtcbiIsIi8vIEFuZ3VsYXIgMSBtb2R1bGVzIGFuZCBmYWN0b3JpZXMgZm9yIHRoZSBidW5kbGVcblxuaWYgKHR5cGVvZiBhbmd1bGFyID09PSAnb2JqZWN0JyAmJiBhbmd1bGFyLm1vZHVsZSkge1xuXG4gIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgSW9uaWMuY29yZG92YS5ib290c3RyYXAoKTtcbiAgfSk7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2lvbmljLmNsb3VkJywgW10pXG5cbiAgLnByb3ZpZGVyKCckaW9uaWNDbG91ZENvbmZpZycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb25maWcgPSBJb25pYy5jb25maWc7XG5cbiAgICB0aGlzLnJlZ2lzdGVyID0gZnVuY3Rpb24oc2V0dGluZ3MpIHtcbiAgICAgIGNvbmZpZy5yZWdpc3RlcihzZXR0aW5ncy5jb3JlKTtcbiAgICAgIGlmIChzZXR0aW5ncy5sb2dnZXIpIHtcbiAgICAgICAgdmFyIGxvZ2dlciA9IElvbmljLmxvZ2dlcjtcbiAgICAgICAgbG9nZ2VyLnNpbGVudCA9IHNldHRpbmdzLmxvZ2dlci5zaWxlbnQ7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuJGdldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9O1xuICB9KVxuXG4gIC5wcm92aWRlcignJGlvbmljQ2xvdWQnLCBbJyRpb25pY0Nsb3VkQ29uZmlnUHJvdmlkZXInLCBmdW5jdGlvbigkaW9uaWNDbG91ZENvbmZpZ1Byb3ZpZGVyKSB7XG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICRpb25pY0Nsb3VkQ29uZmlnUHJvdmlkZXIucmVnaXN0ZXIodmFsdWUpO1xuICAgIH07XG5cbiAgICB0aGlzLiRnZXQgPSBbZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gSW9uaWMuY29yZTtcbiAgICB9XTtcbiAgfV0pXG5cbiAgLmZhY3RvcnkoJyRpb25pY0Nsb3VkTG9nZ2VyJywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBJb25pYy5sb2dnZXI7XG4gIH1dKVxuXG4gIC5mYWN0b3J5KCckaW9uaWNFdmVudEVtaXR0ZXInLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIElvbmljLmV2ZW50RW1pdHRlcjtcbiAgfV0pXG5cbiAgLmZhY3RvcnkoJyRpb25pY0Nsb3VkRGV2aWNlJywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBJb25pYy5kZXZpY2U7XG4gIH1dKVxuXG4gIC5mYWN0b3J5KCckaW9uaWNDbG91ZENvcmRvdmEnLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIElvbmljLmNvcmRvdmE7XG4gIH1dKVxuXG4gIC5mYWN0b3J5KCckaW9uaWNDbG91ZENsaWVudCcsIFtmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSW9uaWMuY2xpZW50O1xuICB9XSlcblxuICAuZmFjdG9yeSgnJGlvbmljU2luZ2xlVXNlclNlcnZpY2UnLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIElvbmljLnNpbmdsZVVzZXJTZXJ2aWNlO1xuICB9XSlcblxuICAuZmFjdG9yeSgnJGlvbmljVXNlcicsIFsnJGlvbmljU2luZ2xlVXNlclNlcnZpY2UnLCBmdW5jdGlvbigkaW9uaWNTaW5nbGVVc2VyU2VydmljZSkge1xuICAgIHJldHVybiAkaW9uaWNTaW5nbGVVc2VyU2VydmljZS5jdXJyZW50KCk7XG4gIH1dKVxuXG4gIC5mYWN0b3J5KCckaW9uaWNBdXRoJywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBJb25pYy5hdXRoO1xuICB9XSlcblxuICAuZmFjdG9yeSgnJGlvbmljUHVzaCcsIFtmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSW9uaWMucHVzaDtcbiAgfV0pXG5cbiAgLmZhY3RvcnkoJyRpb25pY0RlcGxveScsIFtmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSW9uaWMuZGVwbG95O1xuICB9XSlcblxuICAucnVuKFtmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPXG4gIH1dKTtcblxufVxuIiwidmFyIEFwcCA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L2FwcFwiKS5BcHA7XG52YXIgQ29yZSA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L2NvcmVcIikuQ29yZTtcbnZhciBEYXRhVHlwZSA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L3VzZXIvZGF0YS10eXBlc1wiKS5EYXRhVHlwZTtcbnZhciBEZXBsb3kgPSByZXF1aXJlKFwiLi8uLi9kaXN0L2VzNS9kZXBsb3kvZGVwbG95XCIpLkRlcGxveTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiLi8uLi9kaXN0L2VzNS9ldmVudHNcIikuRXZlbnRFbWl0dGVyO1xudmFyIExvZ2dlciA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L2xvZ2dlclwiKS5Mb2dnZXI7XG52YXIgUHVzaCA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L3B1c2gvcHVzaFwiKS5QdXNoO1xudmFyIFB1c2hNZXNzYWdlID0gcmVxdWlyZShcIi4vLi4vZGlzdC9lczUvcHVzaC9tZXNzYWdlXCIpLlB1c2hNZXNzYWdlO1xudmFyIFB1c2hUb2tlbiA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L3B1c2gvdG9rZW5cIikuUHVzaFRva2VuO1xudmFyIGF1dGggPSByZXF1aXJlKFwiLi8uLi9kaXN0L2VzNS9hdXRoXCIpO1xudmFyIGNsaWVudCA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L2NsaWVudFwiKTtcbnZhciBjb25maWcgPSByZXF1aXJlKFwiLi8uLi9kaXN0L2VzNS9jb25maWdcIik7XG52YXIgY29yZG92YSA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L2NvcmRvdmFcIik7XG52YXIgZGV2aWNlID0gcmVxdWlyZShcIi4vLi4vZGlzdC9lczUvZGV2aWNlXCIpO1xudmFyIGRpID0gcmVxdWlyZShcIi4vLi4vZGlzdC9lczUvZGlcIik7XG52YXIgcHJvbWlzZSA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L3Byb21pc2VcIik7XG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L3N0b3JhZ2VcIik7XG52YXIgdXNlciA9IHJlcXVpcmUoXCIuLy4uL2Rpc3QvZXM1L3VzZXIvdXNlclwiKTtcblxuLy8gRGVjbGFyZSB0aGUgd2luZG93IG9iamVjdFxud2luZG93LklvbmljID0gbmV3IGRpLkNvbnRhaW5lcigpO1xuXG4vLyBJb25pYyBNb2R1bGVzXG5Jb25pYy5Db3JlID0gQ29yZTtcbklvbmljLlVzZXIgPSB1c2VyLlVzZXI7XG5Jb25pYy5BdXRoID0gYXV0aC5BdXRoO1xuSW9uaWMuRGVwbG95ID0gRGVwbG95O1xuSW9uaWMuUHVzaCA9IFB1c2g7XG5Jb25pYy5QdXNoVG9rZW4gPSBQdXNoVG9rZW47XG5Jb25pYy5QdXNoTWVzc2FnZSA9IFB1c2hNZXNzYWdlO1xuXG4vLyBEYXRhVHlwZSBOYW1lc3BhY2VcbklvbmljLkRhdGFUeXBlID0gRGF0YVR5cGU7XG5Jb25pYy5EYXRhVHlwZXMgPSBEYXRhVHlwZS5nZXRNYXBwaW5nKCk7XG5cbi8vIENsb3VkIE5hbWVzcGFjZVxuSW9uaWMuQ2xvdWQgPSB7fTtcbklvbmljLkNsb3VkLkFwcCA9IEFwcDtcbklvbmljLkNsb3VkLkF1dGhUeXBlID0gYXV0aC5BdXRoVHlwZTtcbklvbmljLkNsb3VkLkF1dGhUeXBlcyA9IHt9O1xuSW9uaWMuQ2xvdWQuQXV0aFR5cGVzLkJhc2ljQXV0aCA9IGF1dGguQmFzaWNBdXRoO1xuSW9uaWMuQ2xvdWQuQXV0aFR5cGVzLkN1c3RvbUF1dGggPSBhdXRoLkN1c3RvbUF1dGg7XG5Jb25pYy5DbG91ZC5BdXRoVHlwZXMuVHdpdHRlckF1dGggPSBhdXRoLlR3aXR0ZXJBdXRoO1xuSW9uaWMuQ2xvdWQuQXV0aFR5cGVzLkZhY2Vib29rQXV0aCA9IGF1dGguRmFjZWJvb2tBdXRoO1xuSW9uaWMuQ2xvdWQuQXV0aFR5cGVzLkdpdGh1YkF1dGggPSBhdXRoLkdpdGh1YkF1dGg7XG5Jb25pYy5DbG91ZC5BdXRoVHlwZXMuR29vZ2xlQXV0aCA9IGF1dGguR29vZ2xlQXV0aDtcbklvbmljLkNsb3VkLkF1dGhUeXBlcy5JbnN0YWdyYW1BdXRoID0gYXV0aC5JbnN0YWdyYW1BdXRoO1xuSW9uaWMuQ2xvdWQuQXV0aFR5cGVzLkxpbmtlZEluQXV0aCA9IGF1dGguTGlua2VkSW5BdXRoO1xuSW9uaWMuQ2xvdWQuQ29yZG92YSA9IGNvcmRvdmEuQ29yZG92YTtcbklvbmljLkNsb3VkLkNsaWVudCA9IGNsaWVudC5DbGllbnQ7XG5Jb25pYy5DbG91ZC5EZXZpY2UgPSBkZXZpY2UuRGV2aWNlO1xuSW9uaWMuQ2xvdWQuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuSW9uaWMuQ2xvdWQuTG9nZ2VyID0gTG9nZ2VyO1xuSW9uaWMuQ2xvdWQuUHJvbWlzZSA9IHByb21pc2UuUHJvbWlzZTtcbklvbmljLkNsb3VkLkRlZmVycmVkUHJvbWlzZSA9IHByb21pc2UuRGVmZXJyZWRQcm9taXNlO1xuSW9uaWMuQ2xvdWQuU3RvcmFnZSA9IHN0b3JhZ2UuU3RvcmFnZTtcbklvbmljLkNsb3VkLlVzZXJDb250ZXh0ID0gdXNlci5Vc2VyQ29udGV4dDtcbklvbmljLkNsb3VkLlNpbmdsZVVzZXJTZXJ2aWNlID0gdXNlci5TaW5nbGVVc2VyU2VydmljZTtcbklvbmljLkNsb3VkLkF1dGhUb2tlbkNvbnRleHQgPSBhdXRoLkF1dGhUb2tlbkNvbnRleHQ7XG5Jb25pYy5DbG91ZC5Db21iaW5lZEF1dGhUb2tlbkNvbnRleHQgPSBhdXRoLkNvbWJpbmVkQXV0aFRva2VuQ29udGV4dDtcbklvbmljLkNsb3VkLkxvY2FsU3RvcmFnZVN0cmF0ZWd5ID0gc3RvcmFnZS5Mb2NhbFN0b3JhZ2VTdHJhdGVneTtcbklvbmljLkNsb3VkLlNlc3Npb25TdG9yYWdlU3RyYXRlZ3kgPSBzdG9yYWdlLlNlc3Npb25TdG9yYWdlU3RyYXRlZ3k7XG5Jb25pYy5DbG91ZC5Db25maWcgPSBjb25maWcuQ29uZmlnO1xuIl19

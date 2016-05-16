app.service('AuthService', function($q, $http, $resource, USER_ROLES, API_URL) {
  var LOCAL_EMAIL_KEY, LOCAL_TOKEN_KEY, authToke, destroyUserCredentials, isAuthenticated, loadUserCredentials, login, logout, role, storeUserCredentials, useCredentials, username;
  LOCAL_TOKEN_KEY = 'authToken';
  LOCAL_EMAIL_KEY = 'authEmail';
  username = '';
  isAuthenticated = false;
  role = '';
  authToke = void 0;
  loadUserCredentials = function() {
    var email, token;
    token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    email = window.localStorage.getItem(LOCAL_EMAIL_KEY);
    if (token) {
      return useCredentials({
        email: email,
        authentication_token: token
      });
    }
  };
  storeUserCredentials = function(user) {
    window.localStorage.setItem(LOCAL_TOKEN_KEY, user.authentication_token);
    window.localStorage.setItem(LOCAL_EMAIL_KEY, user.email);
    return useCredentials(user);
  };
  useCredentials = function(user) {
    isAuthenticated = true;
    $http.defaults.headers.common['X-User-Token'] = user.authentication_token;
    return $http.defaults.headers.common['X-User-Email'] = user.email;
  };
  destroyUserCredentials = function() {
    var authToken;
    authToken = void 0;
    username = '';
    isAuthenticated = false;
    $http.defaults.headers.common['X-User-Token'] = void 0;
    return window.localStorage.removeItem(LOCAL_TOKEN_KEY);
  };
  login = function(data) {
    return $q(function(resolve, reject) {
      var Session, session_request;
      Session = $resource(API_URL + "/users/sign_in.json");
      session_request = new Session({
        user: data
      });
      return session_request.$save((function(data) {
        storeUserCredentials(data);
        return resolve('Login success.');
      }), function(err) {
        return reject('Login failed');
      });
    });
  };
  logout = function() {
    return destroyUserCredentials();
  };
  loadUserCredentials();
  return {
    login: login,
    logout: logout,
    isAuthenticated: function() {
      return isAuthenticated;
    },
    username: function() {
      return username;
    },
    role: function() {
      return role;
    }
  };
});

var EventsService;

EventsService = (function() {
  'use strict';
  function EventsService(Event, $cacheFactory) {
    this.Event = Event;
    this.cacheFactory = $cacheFactory;
    this;
  }

  EventsService.prototype.findById = function(id) {
    return this.Event.$r.get({
      id: id
    });
  };

  EventsService.prototype.save = function(params) {
    return this.Event.$r.save(params).$promise;
  };

  EventsService.prototype.update = function(params) {
    return this.Event.$r.update(params).$promise;
  };

  EventsService.prototype["delete"] = function(id) {
    return this.Event.$r["delete"]({
      id: id
    }).$promise;
  };

  return EventsService;

})();

app.service('EventsService', EventsService);

var UserServicesService;

UserServicesService = (function() {
  'use strict';
  function UserServicesService(UserService, $cacheFactory) {
    this.UserService = UserService;
    this.cacheFactory = $cacheFactory;
    this;
  }

  UserServicesService.prototype.events = function(params) {
    return this.UserService.$events.query(params).$promise;
  };

  UserServicesService.prototype.findById = function(id) {
    return this.UserService.$r.get({
      id: id
    }).$promise;
  };

  UserServicesService.prototype.find = function(params) {
    return this.UserService.$r.query(params).$promise;
  };

  UserServicesService.prototype.save = function(params) {
    return this.UserService.$r.save(params).$promise;
  };

  UserServicesService.prototype.update = function(params) {
    return this.UserService.$r.update(params).$promise;
  };

  UserServicesService.prototype["delete"] = function(id) {
    return this.UserService.$r["delete"]({
      id: id
    }).$promise;
  };

  return UserServicesService;

})();

app.service('UserServicesService', UserServicesService);

app.factory('UserSession', function($resource, AuthService) {
  return $resource(API_URL + "//users/sign_in.json");
});

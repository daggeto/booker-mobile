app.service('AuthService', function($q, $http, UsersService, USER_ROLES, API_URL, LOCAL_CURRENT_USER_ID) {
  var LOCAL_EMAIL_KEY, LOCAL_TOKEN_KEY, authToken, destroyUserCredentials, isAuthenticated, loadUserCredentials, login, logout, role, storeUserCredentials, useCredentials, username;
  LOCAL_TOKEN_KEY = 'authToken';
  LOCAL_EMAIL_KEY = 'authEmail';
  username = '';
  isAuthenticated = false;
  role = '';
  authToken = void 0;
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
    window.localStorage.setItem(LOCAL_CURRENT_USER_ID, user.id);
    return useCredentials(user);
  };
  useCredentials = function(user) {
    isAuthenticated = true;
    $http.defaults.headers.common['X-User-Token'] = user.authentication_token;
    return $http.defaults.headers.common['X-User-Email'] = user.email;
  };
  destroyUserCredentials = function() {
    authToken = void 0;
    username = '';
    isAuthenticated = false;
    $http.defaults.headers.common['X-User-Token'] = void 0;
    return window.localStorage.removeItem(LOCAL_TOKEN_KEY);
  };
  login = function(data) {
    return $q(function(resolve, reject) {
      return UsersService.login(data).then((function(user) {
        storeUserCredentials(user);
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

var CameraService;

CameraService = (function() {
  'use strict';
  function CameraService($cordovaCamera) {
    this.cordovaCamera = $cordovaCamera;
  }

  CameraService.prototype.capturePhoto = function() {
    return this.takePhoto(Camera.PictureSourceType.CAMERA);
  };

  CameraService.prototype.selectPhoto = function() {
    return this.takePhoto(Camera.PictureSourceType.PHOTOLIBRARY);
  };

  CameraService.prototype.takePhoto = function(sourceType) {
    var options;
    options = {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: sourceType,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
    return this.cordovaCamera.getPicture(options);
  };

  return CameraService;

})();

app.service('CameraService', CameraService);

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

var FileUploadService;

FileUploadService = (function() {
  'use strict';
  function FileUploadService($cordovaFileTransfer, $http) {
    this.cordovaFileTransfer = $cordovaFileTransfer;
    this.header = {
      'X-User-Token': $http.defaults.headers.common['X-User-Token'],
      'X-User-Email': $http.defaults.headers.common['X-User-Email']
    };
    this;
  }

  FileUploadService.prototype.upload = function(method, upload_path, file_uri) {
    return this.cordovaFileTransfer.upload(upload_path, file_uri, {
      httpMethod: method,
      headers: this.header
    });
  };

  return FileUploadService;

})();

app.service('FileUploadService', FileUploadService);

var ServicePhotosService;

ServicePhotosService = (function() {
  'use strict';
  function ServicePhotosService($cacheFactory, ServicePhoto, FileUploadService, API_URL) {
    this.cacheFactory = arguments[0], this.ServicePhoto = arguments[1], this.FileUploadService = arguments[2], this.API_URL = arguments[3];
    this;
  }

  ServicePhotosService.prototype.save = function(params) {
    var path;
    path = this.save_path(params.service_id);
    return this.FileUploadService.upload('POST', path, params.photo_uri);
  };

  ServicePhotosService.prototype.update = function(params) {
    var path;
    path = this.update_path(params.service_id, params.photo_id);
    return this.FileUploadService.upload('PUT', path, params.photo_uri);
  };

  ServicePhotosService.prototype.save_path = function(service_id) {
    return this.API_URL + "/api/v1/services/" + service_id + "/service_photos.json";
  };

  ServicePhotosService.prototype.update_path = function(service_id, photo_id) {
    return this.API_URL + "/api/v1/services/" + service_id + "/service_photos/" + photo_id + ".json";
  };

  ServicePhotosService.prototype["delete"] = function(id) {
    return this.ServicePhoto.$r["delete"]({
      id: id
    }).$promise;
  };

  return ServicePhotosService;

})();

app.service('ServicePhotosService', ServicePhotosService);

var UserServicesService;

UserServicesService = (function() {
  'use strict';
  function UserServicesService($cacheFactory, UserService) {
    this.cacheFactory = arguments[0], this.UserService = arguments[1];
    this;
  }

  UserServicesService.prototype.events = function(params) {
    return this.UserService.$events.query(params).$promise;
  };

  UserServicesService.prototype.service_photos = function(params) {
    return this.UserService.$service_photos.query(params).$promise;
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

var UsersService;

UsersService = (function() {
  'use strict';
  function UsersService($q, $cacheFactory, User) {
    this.q = $q;
    this.cacheFactory = $cacheFactory;
    this.User = User;
    this;
  }

  UsersService.prototype.findById = function(id) {
    return this.User.$r.get({
      id: id
    }).$promise;
  };

  UsersService.prototype.login = function(data) {
    return this.User.$session.save({
      action: 'sign_in',
      user: data
    }).$promise;
  };

  UsersService.prototype.toggleProviderSettings = function(user_id, provider_flag) {
    return this.q((function(_this) {
      return function(resolve, reject) {
        return _this.User.$action.save({
          id: user_id,
          provider_flag: provider_flag,
          action: 'toggle_provider_settings'
        }).$promise.then(function(data) {
          if (data.success) {
            return resolve(data);
          } else {
            return reject(data);
          }
        });
      };
    })(this));
  };

  UsersService.prototype.disableProviding = function(user) {
    return this.User.$service.remove({
      user_id: user.id,
      id: user.service_id
    });
  };

  return UsersService;

})();

app.service('UsersService', UsersService);

var AuthService,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

AuthService = (function() {
  'use strict';
  function AuthService($q, $auth, NotificationService, LOCAL_CURRENT_USER_ID) {
    this.saveToken = bind(this.saveToken, this);
    this.q = arguments[0], this.auth = arguments[1], this.NotificationService = arguments[2], this.LOCAL_CURRENT_USER_ID = arguments[3];
    this.isAuthenticated = this.auth.retrieveData('auth_headers') !== null;
  }

  AuthService.prototype.login = function(data) {
    var d;
    d = this.q.defer();
    this.auth.submitLogin(data).then((function(_this) {
      return function(user) {
        _this.isAuthenticated = true;
        _this.storeUserCredentials(user);
        _this.saveToken();
        return d.resolve(user);
      };
    })(this))["catch"](function() {
      return d.reject('Login failed');
    });
    return d.promise;
  };

  AuthService.prototype.saveToken = function() {
    return this.NotificationService.saveToken();
  };

  AuthService.prototype.logout = function() {
    this.isAuthenticated = true;
    this.destroyUserCredentials();
    return this.auth.signOut().then((function(_this) {
      return function() {
        return console.log('Loggout success');
      };
    })(this))["catch"](function() {
      return console.log('Loggout failed');
    });
  };

  AuthService.prototype.signup = function(data) {
    return this.auth.submitRegistration(data);
  };

  AuthService.prototype.storeUserCredentials = function(user) {
    return window.localStorage.setItem(this.LOCAL_CURRENT_USER_ID, user.id);
  };

  AuthService.prototype.destroyUserCredentials = function() {
    return window.localStorage.removeItem(this.LOCAL_CURRENT_USER_ID);
  };

  return AuthService;

})();

app.service('AuthService', AuthService);

var BookingService,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

BookingService = (function() {
  'use strict';
  function BookingService($q, ionicToast, ReservationsService, Event) {
    this.afterEventBook = bind(this.afterEventBook, this);
    this.q = arguments[0], this.ionicToast = arguments[1], this.ReservationsService = arguments[2], this.Event = arguments[3];
  }

  BookingService.prototype.book = function(event) {
    return this.q((function(_this) {
      return function(resolve, reject) {
        if (event.status !== _this.Event.FREE) {
          return reject();
        }
        _this.resolveMethod = resolve;
        return _this.ReservationsService.save({
          event_id: event.id
        }).then(_this.afterEventBook);
      };
    })(this));
  };

  BookingService.prototype.afterEventBook = function(response) {
    this.ionicToast.show(this.resolveResponse(response.response_code), 'bottom', false, 3000);
    return this.resolveMethod(response);
  };

  BookingService.prototype.resolveResponse = function(response_code) {
    switch (response_code) {
      case 1:
        return "Event can't be booked.";
      case 2:
        return 'It overlaps with your current reservations.';
      case 3:
        return 'It overlaps with your service events.';
      default:
        return 'Event booked. Wait for approval!';
    }
  };

  return BookingService;

})();

app.service('BookingService', BookingService);

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

  CameraService.prototype.cleanup = function() {
    return this.cordovaCamera.cleanup(console.log, console.log);
  };

  return CameraService;

})();

app.service('CameraService', CameraService);

var DeviceService;

DeviceService = (function() {
  'use strict';
  function DeviceService(Device) {
    this.Device = arguments[0];
  }

  DeviceService.prototype.save = function(params) {
    return this.Device.$r.save(params).$promise;
  };

  DeviceService.prototype["delete"] = function(token) {
    return this.Device.$r["delete"]({
      token: token
    }).$promise;
  };

  return DeviceService;

})();

app.service('DeviceService', DeviceService);

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
  function FileUploadService($cordovaFileTransfer, $auth) {
    this.cordovaFileTransfer = arguments[0], this.auth = arguments[1];
    this;
  }

  FileUploadService.prototype.upload = function(method, upload_path, file_uri) {
    return this.cordovaFileTransfer.upload(upload_path, file_uri, {
      httpMethod: method,
      headers: this.auth.retrieveData('auth_headers')
    });
  };

  return FileUploadService;

})();

app.service('FileUploadService', FileUploadService);

var Navigator;

Navigator = (function() {
  'use strict';
  function Navigator($state, $ionicHistory) {
    this.state = arguments[0], this.ionicHistory = arguments[1];
  }

  Navigator.prototype.go = function(state, params) {
    return this.state.go(state, params)["catch"](function(error) {
      return console.log(error);
    });
  };

  Navigator.prototype.home = function(params) {
    return this.state.go('app.main', params);
  };

  Navigator.prototype.back = function() {
    if (this.ionicHistory.backView()) {
      return this.ionicHistory.goBack();
    }
    return this.home();
  };

  return Navigator;

})();

app.service('Navigator', Navigator);

var NotificationService,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

NotificationService = (function() {
  'use strict';
  function NotificationService($rootScope, $ionicPush, $ionicEventEmitter, $cordovaLocalNotification, Navigator, DeviceService) {
    this.registerToken = bind(this.registerToken, this);
    this.onLocalNotificationClick = bind(this.onLocalNotificationClick, this);
    this.onNotification = bind(this.onNotification, this);
    this.rootScope = arguments[0], this.ionicPush = arguments[1], this.ionicEventEmitter = arguments[2], this.cordovaLocalNotification = arguments[3], this.Navigator = arguments[4], this.DeviceService = arguments[5];
    this.ionicEventEmitter.on('push:notification', this.onNotification);
    this.rootScope.$on('$cordovaLocalNotification:click', this.onLocalNotificationClick);
  }

  NotificationService.prototype.onNotification = function(notification) {
    if (notification.raw.additionalData.foreground) {
      return this.onForeground(notification.message);
    }
    return this.onBackground(notification.message);
  };

  NotificationService.prototype.onLocalNotificationClick = function(event, notification, state) {
    var payload;
    payload = JSON.parse(notification.data);
    return this.navigateFromNotification(payload);
  };

  NotificationService.prototype.onForeground = function(message) {
    return this.cordovaLocalNotification.schedule({
      id: 1,
      title: message.title,
      text: message.text,
      data: message.payload
    });
  };

  NotificationService.prototype.onBackground = function(message) {
    return this.navigateFromNotification(message.payload);
  };

  NotificationService.prototype.navigateFromNotification = function(payload) {
    return this.Navigator.go(payload.state, payload.stateParams);
  };

  NotificationService.prototype.registerToken = function() {
    return this.ionicPush.register().then((function(_this) {
      return function(token) {
        console.log("Token registerd " + token);
        return _this.ionicPush.saveToken(token);
      };
    })(this));
  };

  NotificationService.prototype.saveToken = function() {
    if (this.ionicPush.storage.get('ionic_io_push_token')) {
      return this.DeviceService.save({
        token: this.ionicPush.token.token,
        platform: ionic.Platform.platform()
      });
    }
  };

  return NotificationService;

})();

app.service('NotificationService', NotificationService);

var ReservationsService;

ReservationsService = (function() {
  'use strict';
  function ReservationsService(Reservation, $cacheFactory) {
    this.Reservation = arguments[0], this.cacheFactory = arguments[1];
    this;
  }

  ReservationsService.prototype.save = function(params) {
    return this.Reservation.$r.save(params).$promise;
  };

  ReservationsService.prototype["do"] = function(action, reservation_id) {
    return this.Reservation.$r.post({
      reservation_id: reservation_id,
      action: action
    }).$promise;
  };

  return ReservationsService;

})();

app.service('ReservationsService', ReservationsService);

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

  UserServicesService.prototype.findWithGet = function(params) {
    return this.UserService.$r.get(params).$promise;
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

  UserServicesService.prototype.publish = function(service_id) {
    return this.UserService.$r.post({
      id: service_id,
      action: 'publish'
    }).$promise;
  };

  UserServicesService.prototype.unpublish = function(service_id) {
    return this.UserService.$r.post({
      id: service_id,
      action: 'unpublish'
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

  UsersService.prototype.reservations = function(params) {
    params.assoc = 'reservations';
    return this.User.$a.get(params).$promise;
  };

  return UsersService;

})();

app.service('UsersService', UsersService);

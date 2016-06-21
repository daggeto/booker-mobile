var CalendarController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

CalendarController = (function() {
  function CalendarController($scope, $state, $locale, UserServicesService, Event, Calendar, EventsService, service) {
    this.changeStatus = bind(this.changeStatus, this);
    this.loadEvents = bind(this.loadEvents, this);
    this.scope = $scope;
    this.state = $state;
    this.UserServicesService = UserServicesService;
    this.Event = Event;
    this.EventsService = EventsService;
    this.calendar = new Calendar();
    this.service = service;
    this.scope.$on('$ionicView.enter', (function(_this) {
      return function(event, data) {
        return _this.loadEvents(_this.calendar.selectedDate);
      };
    })(this));
    this;
  }

  CalendarController.prototype.eventUrl = function(event) {
    var view;
    view = 'edit_event';
    if (this.isPast()) {
      view = 'preview_event';
    }
    return this.state.go("service.calendar." + view, {
      event_id: event.id,
      calendar: this.calendar
    });
  };

  CalendarController.prototype.loadEvents = function(date) {
    return this.UserServicesService.events({
      service_id: this.service.id,
      start_at: date.format()
    }).then(((function(_this) {
      return function(response) {
        return _this.calendar.events = response;
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
  };

  CalendarController.prototype.deleteEvent = function(id) {
    return this.EventsService["delete"](id).then(((function(_this) {
      return function(response) {
        return _this.state.reload();
      };
    })(this)), function(refejcted) {
      return console.log('not deleted');
    });
  };

  CalendarController.prototype.approveEvent = function(event) {
    return this.changeStatus(event, this.Event.BOOKED);
  };

  CalendarController.prototype.disApproveEvent = function(event) {
    return this.changeStatus(event, this.Event.FREE);
  };

  CalendarController.prototype.changeStatus = function(event, status) {
    return this.EventsService.update({
      id: event.id,
      status: status
    }).then(function() {
      return event.status = status;
    });
  };

  CalendarController.prototype.selectDate = function(date) {
    this.calendar.selectDate(date);
    return this.loadEvents(date);
  };

  CalendarController.prototype.isPast = function() {
    return this.calendar.selectedDate.isBefore(this.calendar.currentDate);
  };

  CalendarController.prototype.goToAddEvent = function() {
    return this.state.go('service.calendar.add_event', {
      calendar: this.calendar
    });
  };

  CalendarController.prototype.back = function() {
    return this.state.go('app.main');
  };

  return CalendarController;

})();

app.controller('CalendarController', CalendarController);

var EventsController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

EventsController = (function() {
  function EventsController($scope, $state, $stateParams, ionicToast, EventsService, Event, event, service) {
    this.modifyDate = bind(this.modifyDate, this);
    this.response = bind(this.response, this);
    this.save = bind(this.save, this);
    this.changeEndDate = bind(this.changeEndDate, this);
    this.scope = $scope;
    this.state = $state;
    this.calendar = $stateParams.calendar;
    this.ionicToast = ionicToast;
    this.EventsService = EventsService;
    this.Event = Event;
    this.event = event;
    this.service = service;
    this.bind();
    this;
  }

  EventsController.prototype.bind = function() {
    if (this.isAddState()) {
      return this.scope.$on('timeCommited', this.changeEndDate);
    }
  };

  EventsController.prototype.changeEndDate = function(event, params) {
    if (params.timePickerName !== 'from') {
      return;
    }
    if (this.event.end_at && moment(params.date).isBefore(this.event.end_at)) {
      return;
    }
    return this.event.end_at = moment(params.date).add(this.service.duration, 'minutes').toDate();
  };

  EventsController.prototype.save = function() {
    if (!this.validateTime()) {
      return;
    }
    this.event['service_id'] = this.service.id;
    this.event.start_at = this.modifyDate(this.event.start_at);
    this.event.end_at = this.modifyDate(this.event.end_at);
    if (this.isAddState()) {
      this.EventsService.save(this.event).then(this.response, function(refejcted) {
        return console.log('rejected');
      });
    }
    if (this.isEditState()) {
      return this.EventsService.update(this.event).then(this.response, function(refejcted) {
        return console.log('rejected');
      });
    }
  };

  EventsController.prototype.response = function(response) {
    return this.state.transitionTo('service.calendar', {
      id: this.service.id
    }, {
      reload: true
    });
  };

  EventsController.prototype.validateTime = function() {
    if (!this.checkRequired(this.event.start_at, 'Time From')) {
      return false;
    }
    if (!this.checkRequired(this.event.end_at, 'Time To')) {
      return false;
    }
    if (moment(this.event.start_at).isAfter(this.event.end_at)) {
      this.showToast("Time From can't be after Time To");
      return false;
    }
    if (this.checkOverlap()) {
      this.showToast('Event overlaps with other this day events');
      return false;
    }
    return true;
  };

  EventsController.prototype.checkRequired = function(value, fieldName) {
    if (value === '') {
      this.showToast(fieldName + " is required");
      return false;
    }
    return true;
  };

  EventsController.prototype.checkOverlap = function() {
    var newEventRange, overlaps;
    newEventRange = moment.range(this.event.start_at, this.event.end_at);
    return overlaps = _.find(this.calendar.events, (function(_this) {
      return function(event, i) {
        var eventRange;
        if (_this.event.id === event.id) {
          return false;
        }
        eventRange = moment.range(event.start_at, event.end_at);
        return newEventRange.intersect(eventRange);
      };
    })(this));
  };

  EventsController.prototype.modifyDate = function(date) {
    var date_moment;
    date_moment = moment(date);
    return moment(this.calendar.selectedDate).hours(date_moment.hours()).minutes(date_moment.minutes()).format(this.calendar.dateTimeFormat);
  };

  EventsController.prototype.showToast = function(message) {
    return this.ionicToast.show(message, 'bottom', false, 3000);
  };

  EventsController.prototype.isAddState = function() {
    return this.state.is('service.calendar.add_event');
  };

  EventsController.prototype.isEditState = function() {
    return this.state.is('service.calendar.edit_event');
  };

  return EventsController;

})();

app.controller('EventsController', EventsController);

var FeedController;

FeedController = (function() {
  function FeedController($scope, UserServicesService) {
    this.scope = $scope;
    this.UserServicesService = UserServicesService;
    this.refreshServices();
    this;
  }

  FeedController.prototype.refreshServices = function() {
    this.currentPage = 1;
    return this.loadServices((function(_this) {
      return function(response) {
        _this.services = response.services;
        _this.anyMoreServices = response.more;
        return _this.scope.$broadcast('scroll.refreshComplete');
      };
    })(this));
  };

  FeedController.prototype.loadMoreServices = function() {
    this.currentPage++;
    return this.loadServices((function(_this) {
      return function(response) {
        _this.services = _this.services.concat(response.services);
        _this.anyMoreServices = response.more;
        return _this.scope.$broadcast('scroll.infiniteScrollComplete');
      };
    })(this));
  };

  FeedController.prototype.loadServices = function(handleResponse) {
    var params;
    params = {
      per_page: 3,
      page: this.currentPage
    };
    return this.UserServicesService.findWithGet(params).then(handleResponse, this.scope.error);
  };

  return FeedController;

})();

app.controller('FeedController', FeedController);

app.controller('LoginController', function($scope, $state, $ionicPopup, AuthService) {
  $scope.data = {};
  return $scope.login = function(data) {
    return AuthService.login(data).then((function(authenticated) {
      $state.go('app.main', {});
      $scope.setCurrentUsername(data.username);
    }));
  };
});

app.controller('MainController', function($scope, $state, $ionicSlideBoxDelegate) {
  $scope.android = ionic.Platform.isAndroid();
  $scope.ios = ionic.Platform.isIOS();
  $scope.setCurrentUsername = function(name) {
    return $scope.username = name;
  };
  $scope.slideTo = function(index) {
    return $ionicSlideBoxDelegate.slide(index);
  };
  $scope.goTo = function(view) {
    return $state.go(view);
  };
  return $scope.goToMain = function() {
    return $state.go('app.main');
  };
});

var ServicePhotosController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ServicePhotosController = (function() {
  function ServicePhotosController($scope, $state, $stateParams, $ionicPopup, $q, $ionicSlideBoxDelegate, $window, $ionicLoading, UserServicesService, ServicePhotosService, CameraService, service) {
    this.error = bind(this.error, this);
    this.reloadPhotos = bind(this.reloadPhotos, this);
    this.photoUploaded = bind(this.photoUploaded, this);
    this.photoTaken = bind(this.photoTaken, this);
    this.scope = arguments[0], this.state = arguments[1], this.stateParams = arguments[2], this.ionicPopup = arguments[3], this.q = arguments[4], this.ionicSlideBoxDelegate = arguments[5], this.window = arguments[6], this.ionicLoading = arguments[7], this.UserServicesService = arguments[8], this.ServicePhotosService = arguments[9], this.CameraService = arguments[10], this.service = arguments[11];
    this.scope.vm = this;
    this;
  }

  ServicePhotosController.prototype.addNewPhoto = function() {
    return this.showTakePhotoPopup();
  };

  ServicePhotosController.prototype.showTakePhotoPopup = function(photo_id) {
    this.scope.photo_id = photo_id;
    return this.takePhotoPopup = this.ionicPopup.show({
      title: 'Select method',
      templateUrl: 'templates/service/upload_photo_popup.html',
      scope: this.scope,
      buttons: [
        {
          text: 'Cancel'
        }
      ]
    });
  };

  ServicePhotosController.prototype.deletePhoto = function(id) {
    return this.ServicePhotosService["delete"](id).then(this.reloadPhotos, this.error);
  };

  ServicePhotosController.prototype.takePhoto = function(photo_id) {
    return this.promisePhoto(Camera.PictureSourceType.CAMERA, photo_id).then(this.photoTaken, this.error);
  };

  ServicePhotosController.prototype.selectPhoto = function(photo_id) {
    return this.promisePhoto(Camera.PictureSourceType.PHOTOLIBRARY, photo_id).then(this.photoTaken, this.error);
  };

  ServicePhotosController.prototype.promisePhoto = function(method, photo_id) {
    this.ionicLoading.show();
    this.takePhotoPopup.close();
    return this.q((function(_this) {
      return function(resolve, reject) {
        return _this.CameraService.takePhoto(method).then(function(photo_uri) {
          return resolve({
            photo_uri: photo_uri,
            photo_id: photo_id
          });
        }, function(error) {
          return reject(error);
        });
      };
    })(this));
  };

  ServicePhotosController.prototype.photoTaken = function(response) {
    if (response.photo_id) {
      return this.ServicePhotosService.update({
        service_id: this.stateParams.id,
        photo_id: response.photo_id,
        photo_uri: response.photo_uri
      }).then(this.photoUploaded, this.error, this.progress);
    } else {
      return this.ServicePhotosService.save({
        service_id: this.stateParams.id,
        photo_uri: response.photo_uri
      }).then(this.photoUploaded, this.error, this.progress);
    }
  };

  ServicePhotosController.prototype.photoUploaded = function(data) {
    this.takePhotoPopup.close();
    this.CameraService.cleanup();
    this.reloadPhotos();
    return this.ionicLoading.hide();
  };

  ServicePhotosController.prototype.progress = function(progress) {};

  ServicePhotosController.prototype.reloadPhotos = function() {
    return this.UserServicesService.service_photos({
      service_id: this.service.id
    }).then((function(_this) {
      return function(service_photos) {
        _this.service.service_photos = service_photos;
        return _this.ionicSlideBoxDelegate.update();
      };
    })(this));
  };

  ServicePhotosController.prototype.showAddPhoto = function() {
    return this.service.service_photos.length < 5;
  };

  ServicePhotosController.prototype.error = function(error) {
    this.ionicLoading.hide();
    return alert(error.body);
  };

  return ServicePhotosController;

})();

app.controller('ServicePhotosController', ServicePhotosController);

var ServiceSettingsController;

ServiceSettingsController = (function() {
  function ServiceSettingsController($scope, $state, service, UserServicesService) {
    this.scope = arguments[0], this.state = arguments[1], this.service = arguments[2], this.UserServicesService = arguments[3];
    this.scope.vm = this;
    this;
  }

  ServiceSettingsController.prototype.durations = [
    {
      value: 15,
      label: '15 min'
    }, {
      value: 30,
      label: '30 min'
    }, {
      value: 45,
      label: '45 min'
    }, {
      value: 60,
      label: '60 min'
    }
  ];

  ServiceSettingsController.prototype.save = function() {
    return this.UserServicesService.update(this.service).then(((function(_this) {
      return function(response) {
        return _this.state.go('app.main');
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
  };

  ServiceSettingsController.prototype.showIosSaveButton = function() {
    return this.scope.ios && this.state.is('service.service_settings');
  };

  ServiceSettingsController.prototype.back = function() {
    return this.state.go('app.main');
  };

  return ServiceSettingsController;

})();

app.controller('ServiceSettingsController', ServiceSettingsController);

var SideController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

SideController = (function() {
  function SideController($scope, $state, $ionicSlideBoxDelegate, $ionicPopup, currentUser, UsersService) {
    this.toggleChange = bind(this.toggleChange, this);
    this.page = 'Side';
    this.scope = $scope;
    this.state = $state;
    this.ionicSlideBoxDelegate = $ionicSlideBoxDelegate;
    this.ionicPopup = $ionicPopup;
    this.currentUser = currentUser;
    this.UsersService = UsersService;
    this;
  }

  SideController.prototype.providerSettingsClicked = function() {
    if (!this.currentUser.service) {
      return this.showAlert();
    }
    return this.state.go('service.service_settings', {
      id: this.currentUser.service.id
    });
  };

  SideController.prototype.showAlert = function() {
    return this.ionicPopup.alert({
      title: 'Hey!',
      template: 'You must enable provider toggle first'
    });
  };

  SideController.prototype.toggleChange = function() {
    return this.UsersService.toggleProviderSettings(this.currentUser.id, this.currentUser.provider).then((function(_this) {
      return function(user) {
        return _this.currentUser = user;
      };
    })(this));
  };

  SideController.prototype.slideTo = function(index, view) {
    this.ionicSlideBoxDelegate.slide(index);
    return this.state.go(view, {
      movieid: 1
    });
  };

  return SideController;

})();

app.controller('SideController', SideController);

var UserServiceController;

UserServiceController = (function() {
  function UserServiceController(service) {
    this.service = service;
    this;
  }

  return UserServiceController;

})();

app.controller('UserServiceController', UserServiceController);

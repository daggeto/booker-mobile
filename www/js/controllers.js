var BookEventController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

BookEventController = (function() {
  function BookEventController($scope, $state, service, BookingService) {
    this.bookEvent = bind(this.bookEvent, this);
    this.scope = arguments[0], this.state = arguments[1], this.service = arguments[2], this.BookingService = arguments[3];
    this.bindListeners();
    this.scope.vm = this;
    this;
  }

  BookEventController.prototype.bindListeners = function() {
    return this.scope.$on('bookEvent', this.bookEvent);
  };

  BookEventController.prototype.bookEvent = function(_, data) {
    return this.BookingService.book(data.event).then((function(_this) {
      return function() {
        return _this.scope.$broadcast('reloadEvents');
      };
    })(this));
  };

  BookEventController.prototype.back = function() {
    return this.state.go('app.main');
  };

  return BookEventController;

})();

app.controller('BookEventController', BookEventController);

var CalendarController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

CalendarController = (function() {
  function CalendarController($scope, $state, $stateParams, UserServicesService, Event, EventsService, ReservationsService, service, Calendar) {
    this.changeStatus = bind(this.changeStatus, this);
    this.loadEvents = bind(this.loadEvents, this);
    this.scope = arguments[0], this.state = arguments[1], this.stateParams = arguments[2], this.UserServicesService = arguments[3], this.Event = arguments[4], this.EventsService = arguments[5], this.ReservationsService = arguments[6], this.service = arguments[7];
    this.calendar = new Calendar(this.stateParams.selectedDate);
    this.scope.$on('$ionicView.enter', (function(_this) {
      return function(event, data) {
        return _this.reloadEvents();
      };
    })(this));
    this;
  }

  CalendarController.prototype.reloadEvents = function() {
    return this.loadEvents(this.calendar.selectedDate);
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
    return this.changeStatus('approve', event.reservation);
  };

  CalendarController.prototype.disapproveEvent = function(event) {
    return this.changeStatus('disapprove', event.reservation);
  };

  CalendarController.prototype.changeStatus = function(action, reservation) {
    return this.ReservationsService["do"](action, reservation.id).then((function(_this) {
      return function(response) {
        return _this.reloadEvents();
      };
    })(this));
  };

  CalendarController.prototype.eventUrl = function(event) {
    var view;
    view = 'edit_event';
    if (this.isPast()) {
      view = 'preview_event';
    }
    return this.scope.navigator.go("service.calendar." + view, {
      event_id: event.id,
      calendar: this.calendar
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

var FeedController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

FeedController = (function() {
  function FeedController($scope, $state, UserServicesService, BookingService) {
    this.reloadService = bind(this.reloadService, this);
    this.scope = arguments[0], this.state = arguments[1], this.UserServicesService = arguments[2], this.BookingService = arguments[3];
    this.bindListeners();
    this.refreshServices();
    this;
  }

  FeedController.prototype.bindListeners = function() {
    return this.scope.$on('bookEvent', (function(_this) {
      return function(_, data) {
        return _this.BookingService.book(data.event).then(function(response) {
          return _this.reloadService(response.service, data.index);
        });
      };
    })(this));
  };

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

  FeedController.prototype.reloadService = function(service, index) {
    return this.services[index].nearest_event = service.nearest_event;
  };

  FeedController.prototype.goTo = function(state, params) {
    return this.state.go(state, params);
  };

  return FeedController;

})();

app.controller('FeedController', FeedController);

var LoginController;

LoginController = (function() {
  function LoginController($scope, $stateParams, AuthService) {
    this.scope = arguments[0], this.stateParams = arguments[1], this.AuthService = arguments[2];
    this.data = {};
    this.message = this.stateParams.message;
    this;
  }

  LoginController.prototype.login = function() {
    return this.AuthService.login(this.data).then((function(_this) {
      return function(authenticated) {
        return _this.scope.navigator.home({
          message: ''
        });
      };
    })(this));
  };

  return LoginController;

})();

app.controller('LoginController', LoginController);

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

var PhotosCarouselController;

PhotosCarouselController = (function() {
  function PhotosCarouselController($scope) {
    this.scope = arguments[0];
    this;
  }

  return PhotosCarouselController;

})();

app.controller('PhotosCarouselController', PhotosCarouselController);

var ReservationsController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ReservationsController = (function() {
  function ReservationsController($scope, $ionicActionSheet, $ionicPopup, currentUser, UsersService, ReservationsService) {
    this.showConfirm = bind(this.showConfirm, this);
    this.scope = arguments[0], this.ionicActionSheet = arguments[1], this.ionicPopup = arguments[2], this.currentUser = arguments[3], this.UsersService = arguments[4], this.ReservationsService = arguments[5];
    this.bindListeners();
    this;
  }

  ReservationsController.prototype.bindListeners = function() {
    this.scope.$on('$ionicView.enter', (function(_this) {
      return function(event, data) {
        return _this.reloadReservations();
      };
    })(this));
    return this.scope.$on('reservationClick', (function(_this) {
      return function(_, data) {
        return _this.ionicActionSheet.show({
          titleText: 'Modify your reservation',
          destructiveText: '<i class="icon ion-close-round"></i> Cancel Reservation',
          cancelText: 'Close',
          destructiveButtonClicked: function() {
            _this.showConfirm(data.reservation);
            return true;
          }
        });
      };
    })(this));
  };

  ReservationsController.prototype.reloadReservations = function() {
    return this.UsersService.reservations({
      user_id: this.currentUser.id,
      group: true
    }).then((function(_this) {
      return function(response) {
        return _this.reservations = response.reservations;
      };
    })(this));
  };

  ReservationsController.prototype.showConfirm = function(reservation) {
    var popup;
    popup = this.ionicPopup.confirm({
      title: 'Do you realy want to cancel this reservation?'
    });
    return popup.then((function(_this) {
      return function(confirmed) {
        if (confirmed) {
          return _this.cancelReservation(reservation);
        }
      };
    })(this));
  };

  ReservationsController.prototype.cancelReservation = function(reservation) {
    return this.ReservationsService["do"]('cancel', reservation.id).then((function(_this) {
      return function() {
        return _this.reloadReservations();
      };
    })(this));
  };

  return ReservationsController;

})();

app.controller('ReservationsController', ReservationsController);

var ServiceCalendarController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ServiceCalendarController = (function() {
  'use strict';
  function ServiceCalendarController($scope, UserServicesService, Calendar, Event) {
    this.selectDate = bind(this.selectDate, this);
    this.loadEvents = bind(this.loadEvents, this);
    this.reloadEvents = bind(this.reloadEvents, this);
    this.scope = arguments[0], this.UserServicesService = arguments[1], this.Calendar = arguments[2], this.Event = arguments[3];
    this.calendar = new Calendar();
    this.bindEvents();
    this.reloadEvents();
    this;
  }

  ServiceCalendarController.prototype.bindEvents = function() {
    return this.scope.$on('reloadEvents', this.reloadEvents);
  };

  ServiceCalendarController.prototype.reloadEvents = function() {
    return this.loadEvents(this.calendar.selectedDate);
  };

  ServiceCalendarController.prototype.loadEvents = function(date) {
    return this.UserServicesService.events({
      service_id: this.service.id,
      action: 'future',
      start_at: date.format(),
      'status[]': [this.Event.FREE, this.Event.PENDING]
    }).then(((function(_this) {
      return function(events) {
        return _this.calendar.events = events;
      };
    })(this)), function(rejected) {
      return console.log(rejected);
    });
  };

  ServiceCalendarController.prototype.selectDate = function(date) {
    if (this.isPast(date)) {
      return;
    }
    this.calendar.selectDate(date);
    return this.loadEvents(date);
  };

  ServiceCalendarController.prototype.isPast = function(date) {
    return date.isBefore(this.calendar.currentDate);
  };

  ServiceCalendarController.prototype.eventClick = function(event) {
    return this.scope.$emit('bookEvent', {
      event: event
    });
  };

  return ServiceCalendarController;

})();

app.controller('ServiceCalendarController', ServiceCalendarController);

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

  ServicePhotosController.prototype.photoUploaded = function(data, other) {
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

var ServiceSettingsController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ServiceSettingsController = (function() {
  function ServiceSettingsController($scope, $state, service, ionicToast, UserServicesService) {
    this.togglePublicationFail = bind(this.togglePublicationFail, this);
    this.togglePublicationSuccess = bind(this.togglePublicationSuccess, this);
    this.afterSave = bind(this.afterSave, this);
    this.scope = arguments[0], this.state = arguments[1], this.service = arguments[2], this.ionicToast = arguments[3], this.UserServicesService = arguments[4];
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
    return this.UserServicesService.update(this.service).then(this.afterSave, this.scope.error);
  };

  ServiceSettingsController.prototype.afterSave = function(response) {
    return this.scope.navigator.home({
      reload: true
    });
  };

  ServiceSettingsController.prototype.togglePublication = function() {
    if (!this.service.published) {
      return this.UserServicesService.unpublish(this.service.id);
    }
    return this.UserServicesService.publish(this.service.id).then(this.togglePublicationSuccess)["catch"](this.togglePublicationFail);
  };

  ServiceSettingsController.prototype.togglePublicationSuccess = function(response) {
    return this.ionicToast.show('Your service will be visible in feed now.', 'bottom', true, 3000);
  };

  ServiceSettingsController.prototype.togglePublicationFail = function(response) {
    this.ionicToast.show(response.data.errors[0], 'bottom', true, 3000);
    return this.service = response.data.service;
  };

  return ServiceSettingsController;

})();

app.controller('ServiceSettingsController', ServiceSettingsController);

var SideController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

SideController = (function() {
  function SideController($scope, $state, $ionicSlideBoxDelegate, $ionicPopup, currentUser, UserServicesService, AuthService) {
    this.goToService = bind(this.goToService, this);
    this.createService = bind(this.createService, this);
    this.scope = arguments[0], this.state = arguments[1], this.ionicSlideBoxDelegate = arguments[2], this.ionicPopup = arguments[3], this.currentUser = arguments[4], this.UserServicesService = arguments[5], this.AuthService = arguments[6];
    this;
  }

  SideController.prototype.providerSettingsClicked = function() {
    if (!this.currentUser.service) {
      return this.showAlert();
    }
    return this.scope.navigator.go('service.service_settings', {
      id: this.currentUser.service.id
    });
  };

  SideController.prototype.showAlert = function() {
    var popup;
    popup = this.ionicPopup.confirm({
      title: 'Start to sell your time!',
      template: 'Here you can setup your service information and your time when you are available.',
      okText: 'Create Service'
    });
    return popup.then((function(_this) {
      return function(confirmed) {
        if (confirmed) {
          return _this.createService();
        }
      };
    })(this));
  };

  SideController.prototype.createService = function() {
    return this.UserServicesService.save({
      confirmed: true
    }).then(this.goToService, this.scope.error);
  };

  SideController.prototype.goToService = function(service) {
    this.currentUser.service = service;
    return this.scope.navigator.go('service.service_settings', {
      id: service.id
    });
  };

  SideController.prototype.slideTo = function(index, view) {
    this.ionicSlideBoxDelegate.slide(index);
    return this.state.go(view, {
      movieid: 1
    });
  };

  SideController.prototype.logout = function() {
    this.AuthService.logout();
    return this.scope.navigator.go('login');
  };

  SideController.prototype.isServicePublished = function() {
    return this.currentUser.service.published;
  };

  SideController.prototype.publicationText = function() {
    if (this.currentUser.service.published) {
      return 'Published';
    }
    return 'Unpublished';
  };

  return SideController;

})();

app.controller('SideController', SideController);

var SignUpController,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

SignUpController = (function() {
  function SignUpController($scope, $ionicPopup, $parse, AuthService) {
    this.scope = arguments[0], this.ionicPopup = arguments[1], this.parse = arguments[2], this.AuthService = arguments[3];
    this.ERROR_FIELDS = ['email', 'password', 'password_confirmation'];
    this.signup_data = {};
    this.scope.email = '';
    this;
  }

  SignUpController.prototype.sign_up = function(form) {
    if (!form.$valid) {
      return;
    }
    return this.AuthService.signup(this.signup_data).then((function(_this) {
      return function(response) {
        return _this.scope.navigator.go('login', {
          message: 'You are registered. You an login now.'
        });
      };
    })(this))["catch"]((function(_this) {
      return function(error) {
        var errors, key, results, value;
        errors = error.data.errors;
        results = [];
        for (key in errors) {
          value = errors[key];
          if (indexOf.call(_this.ERROR_FIELDS, key) >= 0) {
            results.push(form[key].$error.serverMessage = value[0]);
          }
        }
        return results;
      };
    })(this));
  };

  return SignUpController;

})();

app.controller('SignUpController', SignUpController);

var UserServiceController;

UserServiceController = (function() {
  function UserServiceController(service) {
    this.service = service;
    this;
  }

  return UserServiceController;

})();

app.controller('UserServiceController', UserServiceController);

var CalendarController,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

CalendarController = (function() {
  function CalendarController($scope, $state, $locale, $stateParams, UserServicesService, Event, Calendar, EventsService) {
    this.changeStatus = bind(this.changeStatus, this);
    this.scope = $scope;
    this.state = $state;
    this.stateParams = $stateParams;
    this.UserServicesService = UserServicesService;
    this.Event = Event;
    this.EventsService = EventsService;
    this.calendar = new Calendar();
    this.loadService();
    this.scope.$on('$ionicView.enter', (function(_this) {
      return function(event, data) {
        return _this.loadEvents(_this.calendar.selectedDate);
      };
    })(this));
    this;
  }

  CalendarController.prototype.loadService = function() {
    return this.UserServicesService.findById(this.stateParams.id).then(((function(_this) {
      return function(response) {
        return _this.service = response.service;
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
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
      starus: status
    }).then(function() {
      return event.status = status;
    });
  };

  CalendarController.prototype.selectDate = function(date) {
    this.calendar.selectDate(date);
    return this.loadEvents(date);
  };

  CalendarController.prototype.isPast = function() {
    return this.calendar.selectedDate.isSameOrAfter(this.calendar.currentDate);
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
  function EventsController($scope, $state, $stateParams, ionicToast, EventsService, Event, event) {
    this.modifyDate = bind(this.modifyDate, this);
    this.response = bind(this.response, this);
    this.save = bind(this.save, this);
    this.scope = $scope;
    this.state = $state;
    this.calendar = $stateParams.calendar;
    this.service_id = $stateParams.id;
    this.EventsService = EventsService;
    this.Event = Event;
    this.event = event;
    this.ionicToast = ionicToast;
    this.valid = false;
    this.bind();
    this;
  }

  EventsController.prototype.bind = function() {};

  EventsController.prototype.save = function() {
    if (!this.validateTime()) {
      return;
    }
    this.event['service_id'] = this.service_id;
    this.event.start_at = this.modifyDate(this.event.start_at);
    this.event.end_at = this.modifyDate(this.event.end_at);
    if (this.state.is('service.calendar.add_event')) {
      this.EventsService.save(this.event).then(this.response, function(refejcted) {
        return console.log('rejected');
      });
    }
    if (this.state.is('service.calendar.edit_event')) {
      return this.EventsService.update(this.event).then(this.response, function(refejcted) {
        return console.log('rejected');
      });
    }
  };

  EventsController.prototype.response = function(response) {
    return this.state.transitionTo('service.calendar', {
      id: this.service_id
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
        return newEventRange.contains(eventRange) || eventRange.contains(newEventRange);
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

  return EventsController;

})();

app.controller('EventsController', EventsController);

var FeedController;

FeedController = (function() {
  function FeedController($scope, UserServicesService) {
    this.scope = $scope;
    this.UserServicesService = UserServicesService;
    this.loadServices();
    this;
  }

  FeedController.prototype.loadServices = function() {
    return this.UserServicesService.find().then(((function(_this) {
      return function(response) {
        return _this.services = response;
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
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
    }), function(err) {
      var alertPopup;
      return alertPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: 'Please check your credentials!'
      });
    });
  };
});

app.controller('MainController', function($scope, $state, $ionicPopup, $ionicSlideBoxDelegate, AuthService, AUTH_EVENTS) {
  $scope.username = AuthService.username();
  $scope.android = ionic.Platform.isAndroid();
  $scope.ios = ionic.Platform.isIOS();
  $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
    var alertPopup;
    return alertPopup = $ionicPopup.alert({
      title: 'Unauthorized!',
      template: 'You are not allowed to access this resource.'
    });
  });
  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    var alertPopup;
    AuthService.logout();
    $state.go('login');
    return alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, You have to login again.'
    });
  });
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

var ServiceSettingsController;

ServiceSettingsController = (function() {
  function ServiceSettingsController($scope, $state, $stateParams, UserServicesService) {
    this.scope = $scope;
    this.state = $state;
    this.stateParams = $stateParams;
    this.UserServicesService = UserServicesService;
    this.loadService();
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

  ServiceSettingsController.prototype.loadService = function() {
    return this.UserServicesService.findById(this.stateParams.id).then(((function(_this) {
      return function(response) {
        return _this.service = response.service;
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
  };

  ServiceSettingsController.prototype.save = function() {
    return this.UserServicesService.update(this.service).then(((function(_this) {
      return function(response) {
        return _this.state.go('service.calendar');
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

var SideController;

SideController = (function() {
  function SideController($scope, $state, $ionicSlideBoxDelegate) {
    this.page = 'Side';
    this.scope = $scope;
    this.state = $state;
    this.ionicSlideBoxDelegate = $ionicSlideBoxDelegate;
    this;
  }

  SideController.prototype.slideTo = function(index, view) {
    this.ionicSlideBoxDelegate.slide(index);
    return this.state.go(view, {
      movieid: 1
    });
  };

  return SideController;

})();

app.controller('SideController', SideController);

var CalendarController;

CalendarController = (function() {
  function CalendarController($scope, $state, $stateParams, UserService, Event, Calendar) {
    this.scope = $scope;
    this.state = $state;
    this.stateParams = $stateParams;
    this.UserService = UserService;
    this.Event = Event;
    this.calendar = new Calendar();
    this.loadService();
    this;
  }

  CalendarController.prototype.loadService = function() {
    return this.UserService.get(this.stateParams).$promise.then(((function(_this) {
      return function(response) {
        _this.service = response.service;
        return _this.loadEvents(_this.calendar.selectedDate);
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
  };

  CalendarController.prototype.loadEvents = function(date) {
    return this.Event.$r.query({
      service_id: this.service.id,
      start_at: this.calendar.toDateFormat(date)
    }).$promise.then(((function(_this) {
      return function(response) {
        return _this.events = response;
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
  };

  CalendarController.prototype.selectDate = function(date) {
    this.calendar.selectDate(date);
    return this.loadEvents(date);
  };

  CalendarController.prototype.showIosAddButton = function() {
    return this.scope.ios && this.state.is('service.calendar');
  };

  CalendarController.prototype.back = function() {
    return this.state.go('app.main');
  };

  return CalendarController;

})();

app.controller('CalendarController', CalendarController);

var EventsController;

EventsController = (function() {
  function EventsController($scope, $state, $stateParams, UserService, Event) {
    this.scope = $scope;
    this.state = $state;
    this.stateParams = $stateParams;
    this.UserService = UserService;
    this.Event = Event;
    this.event = Event.$new;
    this;
  }

  EventsController.prototype.statuses = [
    {
      value: 'free',
      label: 'Free'
    }, {
      value: 'pending',
      label: 'Pending'
    }, {
      value: 'booked',
      label: 'Booked'
    }
  ];

  EventsController.prototype.add = function() {
    this.event['service_id'] = this.stateParams['id'];
    return this.Event.$r.save(this.event).$promise.then(((function(_this) {
      return function(response) {
        return _this.service = response.service;
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
  };

  EventsController.prototype.showIosAddButton = function() {
    return this.scope.ios && this.state.is('service.add_event');
  };

  return EventsController;

})();

app.controller('EventsController', EventsController);

var FeedController;

FeedController = (function() {
  function FeedController($scope, UserService) {
    this.scope = $scope;
    this.UserService = UserService;
    this.loadServices();
    this;
  }

  FeedController.prototype.loadServices = function() {
    return this.UserService.query().$promise.then(((function(_this) {
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
      $state.go('app.main', {}, {
        reload: true
      });
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
  function ServiceSettingsController($scope, $state, $stateParams, UserService) {
    this.scope = $scope;
    this.state = $state;
    this.stateParams = $stateParams;
    this.UserService = UserService;
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
    return this.UserService.get(this.stateParams).$promise.then(((function(_this) {
      return function(response) {
        return _this.service = response.service;
      };
    })(this)), function(refejcted) {
      return console.log('rejected');
    });
  };

  ServiceSettingsController.prototype.save = function() {
    return this.UserService.update(this.service).$promise.then(((function(_this) {
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

app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $ionicConfigProvider.tabs.position('bottom');
  $stateProvider.state('login', {
    url: '/login',
    controller: 'LoginController',
    templateUrl: 'templates/login.html'
  }).state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/app.html'
  }).state('app.main', {
    url: '/main',
    resolve: {
      UsersService: 'UsersService',
      currentUser: function($window, UsersService, LOCAL_CURRENT_USER_ID) {
        var currentUserId;
        currentUserId = $window.localStorage.getItem(LOCAL_CURRENT_USER_ID);
        return UsersService.findById(currentUserId);
      }
    },
    views: {
      side: {
        templateUrl: 'templates/side.html',
        controller: 'SideController as vm'
      },
      feed: {
        templateUrl: 'templates/feed.html',
        controller: 'FeedController as vm'
      }
    }
  }).state('service', {
    abstract: true,
    controller: 'UserServiceController as vm',
    url: '/service/:id',
    templateUrl: 'templates/service.html',
    resolve: {
      UserServicesService: 'UserServicesService',
      service: function(UserServicesService, $stateParams) {
        return UserServicesService.findById($stateParams.id);
      }
    }
  }).state('service.calendar', {
    url: '/calendar',
    views: {
      'calendar@service': {
        templateUrl: "templates/service/calendar.html",
        controller: 'CalendarController as vm'
      }
    }
  }).state('service.calendar.add_event', {
    cache: false,
    url: '/add_event',
    params: {
      calendar: {}
    },
    resolve: {
      eventResource: 'Event',
      event: function(eventResource) {
        return eventResource.$new();
      }
    },
    views: {
      '@': {
        templateUrl: 'templates/calendar/event.html',
        controller: 'EventsController as vm'
      }
    }
  }).state('service.calendar.edit_event', {
    url: '/edit_event/:event_id',
    params: {
      calendar: {}
    },
    resolve: {
      eventsService: 'EventsService',
      event: function(eventsService, $stateParams) {
        return eventsService.findById($stateParams.event_id).$promise;
      }
    },
    views: {
      '@': {
        templateUrl: 'templates/calendar/event.html',
        controller: 'EventsController as vm'
      }
    }
  }).state('service.calendar.preview_event', {
    url: '/preview_event/:event_id',
    params: {
      calendar: {}
    },
    resolve: {
      eventsService: 'EventsService',
      event: function(eventsService, $stateParams) {
        return eventsService.findById($stateParams.event_id).$promise;
      }
    },
    views: {
      '@': {
        templateUrl: 'templates/calendar/preview_event.html',
        controller: 'EventsController as vm'
      }
    }
  }).state('service.service_settings', {
    url: '/service_settings',
    views: {
      'service_settings@service': {
        templateUrl: "templates/service/service_settings.html",
        controller: 'ServiceSettingsController'
      }
    }
  });
  return $urlRouterProvider.otherwise(function($injector, $location) {
    var $state;
    $state = $injector.get("$state");
    return $state.go('service.service_settings', {
      id: 10
    });
  });
});

app.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS, SERVER_EVENTS) {
  return {
    responseError: function(response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized,
        404: SERVER_EVENTS.not_found
      }[response.status], response);
      return $q.reject(response);
    }
  };
});

app.config(function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});

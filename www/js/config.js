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
    url: '/service/:id',
    templateUrl: 'templates/service.html'
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
    cache: false,
    url: '/edit_event/:event_id',
    params: {
      calendar: {}
    },
    resolve: {
      eventResource: 'Event',
      event: function(eventResource, $stateParams) {
        var event_id, id;
        id = $stateParams.id, event_id = $stateParams.event_id;
        return eventResource.$r.get({
          id: event_id,
          service_id: id
        }).$promise;
      }
    },
    views: {
      '@': {
        templateUrl: 'templates/calendar/event.html',
        controller: 'EventsController as vm'
      }
    }
  }).state('service.service_settings', {
    url: '/service_settings',
    views: {
      'service_settings@service': {
        templateUrl: "templates/service/service_settings.html",
        controller: 'ServiceSettingsController as vm'
      }
    }
  });
  return $urlRouterProvider.otherwise('/service/1/calendar');
});

app.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function(response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized
      }[response.status], response);
      return $q.reject(response);
    }
  };
});

app.config(function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});

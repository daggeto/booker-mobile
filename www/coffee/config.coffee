app.config ($stateProvider, $urlRouterProvider, $ionicConfigProvider) ->
  $ionicConfigProvider.tabs.position('bottom');

  $stateProvider
      .state('login'
        url: '/login'
        controller: 'LoginController'
        templateUrl: 'templates/login.html')

      .state('app'
        url: '/app'
        abstract: true
        templateUrl: 'templates/app.html')

      .state('app.main'
        url: '/main'
        views:
          side:
            templateUrl: 'templates/side.html'
            controller: 'SideController as vm'
          feed:
            templateUrl: 'templates/feed.html'
            controller: 'FeedController as vm')

      .state('service'
        abstract: true
        url: '/service/:id'
        templateUrl: 'templates/service.html')

      .state('service.calendar'
        url: '/calendar'
        views:
          calendar:
            templateUrl: "templates/service/calendar.html"
            controller: 'CalendarController as vm')

      .state('service.add_event'
        url: '/add_event'
        params: 
          calendar: {}
        views:
          calendar:
            templateUrl: 'templates/calendar/add_event.html'
            controller: 'EventsController as vm'
      )

      .state('service.service_settings'
        url: '/service_settings'
        views:
          service_settings:
            templateUrl: "templates/service/service_settings.html"
            controller: 'ServiceSettingsController as vm')

  $urlRouterProvider.otherwise('/service/1/calendar')

app.factory('AuthInterceptor', ($rootScope, $q, AUTH_EVENTS) ->
  { responseError: (response) ->
    $rootScope.$broadcast {
      401: AUTH_EVENTS.notAuthenticated
      403: AUTH_EVENTS.notAuthorized
    }[response.status], response
    $q.reject response
 }
)
app.config ($httpProvider) ->
  $httpProvider.interceptors.push 'AuthInterceptor'
  return

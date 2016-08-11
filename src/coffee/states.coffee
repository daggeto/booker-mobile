app.config ($stateProvider, $urlRouterProvider) ->
  $stateProvider
    .state('login'
      cache: false
      url: '/login/:message'
      controller: 'LoginController as vm'
      templateUrl: 'templates/login.html')

    .state('signup'
      cache: false
      url: '/signup'
      controller: 'SignUpController as vm'
      templateUrl: 'templates/signup.html')

    .state('app'
      url: '/app'
      abstract: true
      templateUrl: 'templates/app.html')

    .state('app.main'
      url: '/main'
      resolve:
        UsersService: 'UsersService'
        currentUser: ($window, UsersService, LOCAL_CURRENT_USER_ID, $auth) ->
          currentUserId = $window.localStorage.getItem(LOCAL_CURRENT_USER_ID)
          UsersService.findById(currentUserId)

      views:
        side:
          templateUrl: 'templates/side.html'
          controller: 'SideController as vm'
        feed:
          templateUrl: 'templates/feed.html'
          controller: 'FeedController as vm')

    .state('app.main.reservations'
      url: '/reservations'
      views:
        '@':
          templateUrl: 'templates/reservations.html'
          controller: 'ReservationsController as vm'
    )

    .state('service'
      abstract: true
      cache: false
      url: '/service/:id'
      templateUrl: 'templates/service.html'
      resolve:
        UserServicesService: 'UserServicesService'
        service: (UserServicesService, $stateParams) ->
          UserServicesService.findById($stateParams.id))

    .state('service.calendar'
      url: '/calendar/:selectedDate'
      views:
        'calendar@service':
          templateUrl: "templates/service/calendar.html"
          controller: 'CalendarController as vm')
    .state('service.calendar.add_event'
      cache: false
      url: '/add_event'
      params:
        calendar: {}
      resolve:
        eventResource: 'Event'
        event: (eventResource) ->
          eventResource.$new()
      views:
        '@':
          templateUrl: 'templates/calendar/event.html'
          controller: 'EventsController as vm')

    .state('service.calendar.edit_event'
      cache: false
      url: '/edit_event/:event_id'
      params:
        calendar: {}
      resolve:
        eventsService: 'EventsService'
        event: (eventsService, $stateParams) ->
          eventsService.findById($stateParams.event_id).$promise
      views:
        '@':
          templateUrl: 'templates/calendar/event.html'
          controller: 'EventsController as vm')

    .state('service.calendar.preview_event'
      url: '/preview_event/:event_id'
      params:
        calendar: {}
      resolve:
        eventsService: 'EventsService'
        event: (eventsService, $stateParams) ->
          eventsService.findById($stateParams.event_id).$promise
      views:
        '@':
          templateUrl: 'templates/calendar/preview_event.html'
          controller: 'EventsController as vm')

    .state('service.service_settings'
      url: '/service_settings'
      views:
        'service_settings@service':
          templateUrl: "templates/service/service_settings.html"
          controller: 'ServiceSettingsController as vm'
        'photos@service.service_settings':
          templateUrl: 'templates/service/photos.html'
          controller: 'ServicePhotosController')
    .state('book_service',
      cache: false,
      url: '/book_service/:id',
      controller: 'BookEventController as vm'
      templateUrl: 'templates/book/service.html'
      resolve:
        UserServicesService: 'UserServicesService'
        service: (UserServicesService, $stateParams) ->
          UserServicesService.findById($stateParams.id))

  $urlRouterProvider.otherwise( ($injector, $location) ->
    $state = $injector.get("$state")
    $state.go('app.main')
  )

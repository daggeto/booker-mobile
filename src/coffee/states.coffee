app.config ($stateProvider, $urlRouterProvider) ->
  $stateProvider
    .state('login'
      cache: false
      url: '/login/:message'
      controller: 'LoginController as vm'
      templateUrl: 'templates/login.html')

    .state('signup'
      url: '/signup'
      controller: 'SignUpController as vm'
      templateUrl: 'templates/signup.html')

    .state('terms'
      url: '/terms'
      templateUrl: 'templates/terms.html')

    .state('app'
      url: '/app'
      resolve:
        UsersService: 'UsersService'
        currentUser: ($window, UsersService) ->
          UsersService.current()
      abstract: true
      controller: 'MainController as vm'
      templateUrl: 'templates/app.html')

    .state('app.main'
      url: '/main'
      views:
        'content@app':
          templateUrl: 'templates/slides.html'
        'side@app.main':
          templateUrl: 'templates/side.html'
          controller: 'SideController as vm'
        'feed@app.main':
          templateUrl: 'templates/feed.html'
          controller: 'FeedController as vm')

    .state('app.main.search_results'
      url: '/search_results/:results'
      views:
        'content@app':
          templateUrl: 'templates/components/search_results.html'
          controller: 'SearchResultController as vm'
    )

    .state('app.main.notifications',
      url: '/notifications/'
      views:
        '@':
          templateUrl: 'templates/notifications.html'
          controller: 'NotificationsController as vm'
    )

    .state('app.main.reservations'
      url: '/reservations'
      views:
        '@':
          templateUrl: 'templates/reservations.html'
          controller: 'ReservationsController as vm'
    )

    .state('app.main.profile_edit'
      url: '/profile_edit'
      cache: false
      views:
        '@':
          templateUrl: 'templates/profile/edit.html'
          controller: 'ProfileEditController as vm'
    )

    .state('app.main.profile'
      url: '/profile/:user_id'
      cache: false
      resolve:
        UsersService: 'UsersService'
        user: (UsersService, $stateParams) ->
          UsersService.findById($stateParams.user_id)
      views:
        '@':
          templateUrl: 'templates/profile/show.html'
          controller: 'ProfileController as vm'
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
        event: (Event) ->
          Event.$new()
      views:
        '@':
          templateUrl: 'templates/calendar/event/add.html'
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
          templateUrl: 'templates/calendar/event/edit.html'
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
          templateUrl: 'templates/calendar/event/preview.html'
          controller: 'EventsController as vm')

    .state('service.service_settings'
      url: '/service_settings'
      views:
        'service_settings@service':
          templateUrl: "templates/service/service_settings.html"
          controller: 'ServiceSettingsController as vm'
        'photos@service.service_settings':
          templateUrl: 'templates/service/photos.html'
          controller: 'ServicePhotosController as vm')

    .state('service.reservations'
      url: '/reservations/'
      views:
        'reservations@service':
          templateUrl: "templates/service/reservations.html"
          controller: 'ServiceReservationsController as vm')

    .state('book_service',
      cache: false,
      url: '/book_service/:id',
      controller: 'BookEventController as vm'
      templateUrl: 'templates/book/service.html'
      resolve:
        UserServicesService: 'UserServicesService'
        service: (UserServicesService, $stateParams) ->
          UserServicesService.findById($stateParams.id))

    .state('book_service.reports',
      cache: false,
      url: '/reports',
      views:
        '@':
          controller: 'ReportsController as vm',
          templateUrl: 'templates/book/reports.html')

  $urlRouterProvider.otherwise( ($injector, $location) ->
    $state = $injector.get("$state")
    $state.go('app.main')
  )

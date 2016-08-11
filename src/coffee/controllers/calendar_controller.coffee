class CalendarController
  constructor: (
    $scope,
    $state,
    $stateParams,
    UserServicesService,
    Event,
    EventsService,
    ReservationsService,
    service,
    Calendar) ->
    [
      @scope,
      @state,
      @stateParams,
      @UserServicesService,
      @Event,
      @EventsService,
      @ReservationsService,
      @service
    ] = arguments

    @calendar = new Calendar(@stateParams.selectedDate)

    @scope.$on('$ionicView.enter', (event, data) =>
      @reloadEvents()
    )

    this

  reloadEvents: ->
    @loadEvents(@calendar.selectedDate)

  loadEvents: (date) =>
    @UserServicesService.events(
      service_id: @service.id
      start_at: date.format()
    ).then(((response) =>
      @calendar.events = response
    ), (refejcted) ->
      console.log('rejected')
    )

  deleteEvent: (id) ->
    @EventsService.delete(id).then(((response) =>
      @state.reload()
    ), (refejcted) ->
      console.log('not deleted')
    )

  approveEvent: (event) ->
    @changeStatus('approve', event.reservation)

  disapproveEvent: (event) ->
    @changeStatus('disapprove', event.reservation)

  changeStatus: (action, reservation) =>
    @ReservationsService.do(action, reservation.id).then (response) =>
      @reloadEvents()

  eventUrl: (event) ->
    view = 'edit_event'
    view = 'preview_event' if @isPast()
    @scope.navigator.go("service.calendar.#{view}", event_id: event.id, calendar: @calendar)

  selectDate: (date) ->
    @calendar.selectDate(date)
    @loadEvents(date)

  isPast: ->
    @calendar.selectedDate.isBefore(@calendar.currentDate)

  goToAddEvent: ->
    @state.go('service.calendar.add_event', calendar: @calendar)

  back: ->
    @state.go('app.main')

app.controller('CalendarController', CalendarController)

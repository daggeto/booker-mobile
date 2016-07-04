class CalendarController
  constructor: (
    $scope, $state, $locale, UserServicesService, Event, Calendar, EventsService, service) ->
    @scope = $scope
    @state = $state
    @UserServicesService = UserServicesService
    @Event = Event
    @EventsService = EventsService
    @calendar = new Calendar()
    @service = service

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
    @changeStatus('approve', event)

  disapproveEvent: (event) ->
    @changeStatus('disapprove', event)

  changeStatus: (action, event) =>
    @EventsService.do(action, event.id).then (response) =>
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

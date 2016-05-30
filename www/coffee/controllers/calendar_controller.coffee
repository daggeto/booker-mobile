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
      @loadEvents(@calendar.selectedDate)
    )

    this

  eventUrl: (event) ->
    view = 'edit_event'
    view = 'preview_event' if @isPast()
    @state.go("service.calendar.#{view}", event_id: event.id, calendar: @calendar)

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
    @changeStatus(event, @Event.BOOKED)

  disApproveEvent: (event) ->
    @changeStatus(event, @Event.FREE)

  changeStatus: (event, status) =>
    @EventsService.update(id: event.id, status: status).then ->
      event.status = status

  selectDate: (date) ->
    @calendar.selectDate(date)
    @loadEvents(date)


  isPast: ->
    @calendar.selectedDate.isBefore(@calendar.currentDate)

  back: ->
    @state.go('app.main')

app.controller('CalendarController', CalendarController)

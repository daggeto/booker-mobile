class CalendarController
  constructor: (
    $scope, $state, $locale, $stateParams, UserServicesService, Event, Calendar, EventsService
    ) ->
    @scope = $scope
    @state = $state
    @stateParams = $stateParams
    @UserServicesService = UserServicesService
    @Event = Event
    @EventsService = EventsService
    @calendar = new Calendar()
    @loadService()

    @scope.$on('$ionicView.enter', (event, data) =>
      @loadEvents(@calendar.selectedDate)
    )

    this

  loadService: ->
    @UserServicesService.findById(@stateParams.id).then(((response) =>
      @service = response.service
    ), (refejcted) ->
      console.log('rejected')
    )

  loadEvents: (date) ->
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
    @EventsService.update(id: event.id, starus: status).then ->
      event.status = status

  selectDate: (date) ->
    @calendar.selectDate(date)
    @loadEvents(date)


  isPast: ->
    @calendar.selectedDate.isSameOrAfter(@calendar.currentDate)

  back: ->
    @state.go('app.main')

app.controller('CalendarController', CalendarController)

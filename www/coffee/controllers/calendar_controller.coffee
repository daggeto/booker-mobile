class CalendarController
  constructor: (
    $scope, $state, $locale, $stateParams,
    UserService, Event, Calendar, ChangeEventStatus, AjaxInterceptor
  ) ->
    @scope = $scope
    @state = $state
    @stateParams = $stateParams
    @UserService = UserService
    @Event = Event
    @ChangeEventStatus = ChangeEventStatus
    @AjaxInterceptor = AjaxInterceptor
    @calendar = new Calendar()
    @loadService()

    @scope.$on('$ionicView.enter', (event, data) =>
      @loadEvents(@calendar.selectedDate)
    )

    this

  loadService: ->
    @UserService.get(@stateParams).$promise.then(((response) =>
      @service = response.service
      @loadEvents(@calendar.selectedDate)
    ), (refejcted) ->
      console.log('rejected')
    )

  loadEvents: (date) ->
    @Event.$r.query(
      service_id: @service.id
      start_at: date.format()
    ).$promise.then(((response) =>
      @calendar.events = response
    ), (refejcted) ->
      console.log('rejected')
    )

  deleteEvent: (id) ->
    @Event.$r.delete(
      service_id: @service.id
      id: id
    ).$promise.then(((response) =>
      @state.reload()
    ), (refejcted) ->
      console.log('not deleted')
    )

  approveEvent: (event) ->
    @changeStatus(event, @Event.BOOKED)

  disApproveEvent: (event) ->
    @changeStatus(event, @Event.FREE)

  changeStatus: (event, status) =>
    @ChangeEventStatus(event.id, @service.id, status).then ->
      event.status = status

  selectDate: (date) ->
    @calendar.selectDate(date)
    @loadEvents(date)


  isPast: ->
    @calendar.selectedDate.isSameOrAfter(@calendar.currentDate)

  back: ->
    @state.go('app.main')

app.controller('CalendarController', CalendarController)

class CalendarController
  constructor: ($scope, $state, $locale, $stateParams, UserService, Event, Calendar) ->
    @scope = $scope
    @state = $state
    @stateParams = $stateParams
    @UserService = UserService
    @Event = Event

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
    params = {}
    params['status'] = status
    params['service_id'] = @service.id
    params['id'] = event.id

    @Event.$r.update(params).$promise.then(((response) =>
      event.status = status
    ), (rejected) ->
      console.log('wrong status change')
    )

  selectDate: (date) ->
    @calendar.selectDate(date)
    @loadEvents(date)

  showIosAddButton: ->
    @scope.ios && @state.is('service.calendar')

  back: ->
    @state.go('app.main')

app.controller('CalendarController', CalendarController)

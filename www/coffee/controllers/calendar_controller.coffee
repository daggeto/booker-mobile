class CalendarController
  constructor: ($scope, $state, $stateParams, UserService, Event, Calendar) ->
    @scope = $scope
    @state = $state
    @stateParams = $stateParams
    @UserService = UserService
    @Event = Event

    @calendar = new Calendar()
    @loadService()

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
      start_at: @calendar.toDateFormat(date)
    ).$promise.then(((response) =>
      @events = response
    ), (refejcted) ->
      console.log('rejected')
    )

  selectDate: (date) ->
    @calendar.selectDate(date)
    @loadEvents(date)

  showIosAddButton: ->
    @scope.ios && @state.is('service.calendar')

  back: ->
    @state.go('app.main')

app.controller('CalendarController', CalendarController)

app.controller 'CalendarController',
  (
    $scope,
    $state,
    $stateParams,
    UserServicesService,
    Event,
    EventsService,
    Calendar,
    service,
    ServiceEventActionSheet
  ) ->
    new class CalendarController
      constructor:  ->
        @service = service

        @bindListeners()

        @calendar = new Calendar($stateParams.selectedDate)

        $scope.$on('$ionicView.enter', (event, data) =>
          @reloadEvents()
        )


      bindListeners: ->
        $scope.$on 'onEventClick', @onEventClick

      reloadEvents: =>
        @loadEvents(@calendar.selectedDate)

      loadEvents: (date) =>
        UserServicesService.events(
          service_id: service.id
          start_at: date.format()
        ).then(((response) =>
          @calendar.events = response
        ), (refejcted) ->
          console.log('rejected')
        )

      onEventClick: (_, data)=>
        ServiceEventActionSheet.show(data.event, data.reservation, @reloadEvents)

      selectDate: (date) ->
        @calendar.selectDate(date)
        @loadEvents(date)

      addEvent: ->
        $scope.navigator.go('service.calendar.add_event', calendar: @calendar)

      onWeekSwipe: (direction) =>
        @calendar.nextWeek() if direction == 'left'
        @calendar.previousWeek() if direction == 'right'

        @reloadEvents()

      onDaySwipe: (direction) =>
        @calendar.nextDay() if direction == 'left'
        @calendar.previousDay() if direction == 'right'

        @reloadEvents()

      isPast: ->
        @calendar.selectedDate.isBefore(@calendar.currentDate)

      back: ->
        $scope.navigator.go('app.main')

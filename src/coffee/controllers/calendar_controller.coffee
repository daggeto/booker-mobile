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
    ServiceEventActionSheet,
    Navigator
  ) ->
    new class CalendarController
      constructor:  ->
        @service = service

        @bindListeners()

        @calendar = new Calendar($stateParams.selectedDate)

        $scope.$on('$ionicView.enter', =>
          @reloadEvents()
        )


      bindListeners: ->
        $scope.$on 'onEventClick', @onEventClick
        $scope.$on 'onEventAvatarClick', @onEventAvatarClick
        $scope.$on 'onDateSelected', @reloadEvents

      reloadEvents: (_ = null, data = {}) =>
        @loadEvents(data.date || @calendar.selectedDate)

      loadEvents: (date) =>
        UserServicesService.events(
          service_id: service.id
          start_at: date.format()
        ).then (response) =>
          @calendar.update(response)

      onEventClick: (_, data)=>
        ServiceEventActionSheet.show(data.event, data.reservation, @reloadEvents, @calendar)

      onEventAvatarClick: (_, data) =>
        Navigator.go('app.main.profile', user_id: data.event.user.id)

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

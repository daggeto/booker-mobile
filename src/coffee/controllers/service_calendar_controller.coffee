app.controller 'ServiceCalendarController',
  ($scope, UserServicesService, Calendar, EVENT_STATUS) ->
    { service } = this

    new class ServiceCalendarController
      constructor: ->
        @calendar = new Calendar()

        @bindEvents()
        @reloadEvents()

      bindEvents: ->
        $scope.$on('reloadEvents', @reloadEvents)

      reloadEvents: =>
        @loadEvents(@calendar.selectedDate)

      loadEvents: (date) =>
        UserServicesService.events(
          service_id: service.id
          action: 'future'
          start_at: date.format()
          'status[]': [EVENT_STATUS.FREE, EVENT_STATUS.PENDING]
        ).then(((events) =>
          @calendar.events = events
        ), (rejected) ->
          console.log(rejected)
        )

      selectDate: (date) =>
        return if @isPast(date)
        @calendar.selectDate(date)
        @loadEvents(date)

      isPast: (date) ->
        date.isBefore(@calendar.currentDate)

      eventClick: (event) ->
        $scope.$emit('bookEvent', { event: event })

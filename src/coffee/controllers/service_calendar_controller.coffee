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
        $scope.$on('onEventButtonClick', @eventClick)
        $scope.$on('onDateSelected', @reloadEvents)

      reloadEvents: (_ = null, data = {}) =>
        @loadEvents(data.date || @calendar.selectedDate)

      loadEvents: (date) =>
        UserServicesService.future_events(
          service_id: service.id
          start_at: date.format()
        ).then(((response) =>
          @calendar.update(response)
        ), (rejected) ->
          console.log(rejected)
        )

      selectDate: (date) =>
        return if @isPast(date)
        @calendar.selectDate(date)

      isPast: (date) ->
        date.isBefore(@calendar.currentDate)

      eventClick: (_, data) ->
        $scope.$emit('bookEvent', { event: data.event })

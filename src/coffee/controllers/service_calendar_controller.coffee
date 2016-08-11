class ServiceCalendarController
  'use strict'

  constructor: ($scope, UserServicesService, Calendar, Event) ->
    [@scope, @UserServicesService, @Calendar, @Event] = arguments
    @calendar = new Calendar()

    @bindEvents()
    @reloadEvents()

    this

  bindEvents: ->
    @scope.$on('reloadEvents', @reloadEvents)

  reloadEvents: =>
    @loadEvents(@calendar.selectedDate)

  loadEvents: (date) =>
    @UserServicesService.events(
      service_id: @service.id
      action: 'future'
      start_at: date.format()
      'status[]': [@Event.FREE, @Event.PENDING]
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
    @scope.$emit('bookEvent', { event: event })

app.controller('ServiceCalendarController', ServiceCalendarController)

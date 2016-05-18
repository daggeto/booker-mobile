class EventsController
  constructor: ($scope, $state, $stateParams, ionicToast, EventsService, Event, event, service) ->
    @scope = $scope
    @state = $state
    @calendar = $stateParams.calendar
    @ionicToast = ionicToast
    @EventsService = EventsService
    @Event = Event
    @event = event
    @service = service

    @bind()

    this

  bind: ->
    @scope.$on 'timeCommited', @changeEndDate if @isAddState()

  changeEndDate: (event, params) =>
    return unless params.timePickerName == 'from'
    return if @event.end_at && moment(params.date).isBefore(@event.end_at)

    @event.end_at = moment(params.date).add(@service.duration, 'minutes').toDate()

  save: =>
    return unless @validateTime()

    @event['service_id'] = @service.id
    @event.start_at = @modifyDate(@event.start_at)
    @event.end_at = @modifyDate(@event.end_at)

    if @isAddState()
      @EventsService.save(@event).then(@response, (refejcted) ->
        console.log('rejected')
      )

    if @isEditState()
      @EventsService.update(@event).then(@response, (refejcted) ->
        console.log('rejected')
      )

  response: (response) =>
    @state.transitionTo('service.calendar', {id: @service.id}, reload: true)

  validateTime: ->
    return false unless @checkRequired(@event.start_at, 'Time From')
    return false unless @checkRequired(@event.end_at, 'Time To')

    if moment(@event.start_at).isAfter(@event.end_at)
      @showToast("Time From can't be after Time To")
      return false

    if @checkOverlap()
      @showToast('Event overlaps with other this day events')
      return false

    true

  checkRequired: (value, fieldName) ->
    if value == ''
       @showToast("#{fieldName} is required")
       return false

     true

  checkOverlap:  ->
    newEventRange = moment.range(@event.start_at, @event.end_at)

    overlaps = _.find(@calendar.events, (event, i) =>
      return false if @event.id == event.id

      eventRange = moment.range(event.start_at, event.end_at)

      newEventRange.contains(eventRange) || eventRange.contains(newEventRange)
    )

  modifyDate: (date) =>
    date_moment= moment(date)

    moment(@calendar.selectedDate)
      .hours(date_moment.hours())
      .minutes(date_moment.minutes())
      .format(@calendar.dateTimeFormat)

  showToast: (message) ->
    @ionicToast.show(message, 'bottom', false, 3000);

  isAddState: ->
    @state.is('service.calendar.add_event')

  isEditState: ->
    @state.is('service.calendar.edit_event')

app.controller('EventsController', EventsController)

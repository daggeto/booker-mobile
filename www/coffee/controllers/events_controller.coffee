class EventsController
  statuses: [
    { value: 'free', label: 'Free' }
    { value: 'pending', label: 'Pending' }
    { value: 'booked', label: 'Booked' }
  ]

  constructor: ($scope, $state, $stateParams, UserService, Event, ionicToast) ->
    @scope = $scope
    @state = $state
    @calendar = $stateParams.calendar
    @service_id = $stateParams.id
    @UserService = UserService
    @Event = Event
    @event = Event.$new()
    @ionicToast = ionicToast

    @valid = false

    @bind()

    this

  bind: ->

  validateTime: (event, params) =>
    timePickerName = params.timePickerName

    @validateTimeFrom(params.date) if timePickerName == 'from'
    @validateTimeTo(moment(params.date)) if timePickerName == 'to'

  save: =>
    return unless @validateTime()

    @event['service_id'] = @service_id
    @event.start_at = @modifyDate(@event.start_at)
    @event.end_at = @modifyDate(@event.end_at)

    @Event.$r.save(@event).$promise.then(((response) =>
      @state.transitionTo('service.calendar', {id: @service_id},
        reload: true
        inherit: true
        notify: true
      )
    ), (refejcted) ->
      console.log('rejected')
    )

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

  showIosAddButton: ->
    @scope.ios && @state.is('service.calendar.add_event')

app.controller('EventsController', EventsController)

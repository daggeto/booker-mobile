class EventsController
  statuses: [
    { value: 'free', label: 'Free' }
    { value: 'pending', label: 'Pending' }
    { value: 'booked', label: 'Booked' }
  ]

  constructor: ($scope, $state, $stateParams, UserService, Event) ->
    @scope = $scope
    @state = $state
    @calendar = $stateParams.calendar
    @service_id = $stateParams.id
    @UserService = UserService
    @Event = Event
    @event = Event.$new

    @valid = false

    @bind()

    this

  bind: ->
    @scope.$on('timeChanged', @validateTime)

  validateTime: (event, params) =>
    timePickerName = params.timePickerName

    @validateTimeFrom(params.date) if timePickerName == 'from'
    @validateTimeTo(moment(params.date)) if timePickerName == 'to'

  validateTimeFrom: (date) ->
    return alert('Overlaps') if @checkOverlap(date)

    return alert("Can't be after Time To") if date.isAfter(@event.end_at)

  validateTimeTo: (date) ->
    return alert('Overlaps') if @checkOverlap(date)

    return alert("Can't be before Time From") if date.isBefore(@event.start_at)

  checkOverlap: (date) ->
    overlaps = _.find(@calendar.events, (event, i) =>
      moment.range(event.start_at, event.end_at).contains(date)
    )
  save: =>
    @event['service_id'] = @service_id
    @event.start_at = @modifyDate(@event.start_at)
    @event.end_at = @modifyDate(@event.end_at)

    @Event.$r.save(@event).$promise.then(((response) =>
      @state.go('service.calendar')
    ), (refejcted) ->
      console.log('rejected')
    )

  modifyDate: (date) =>
    date_moment= moment(date)

    moment(@calendar.selectedDate)
      .hours(date_moment.hours())
      .minutes(date_moment.minutes())
      .format(@calendar.dateTimeFormat)

  showIosAddButton: ->
    @scope.ios && @state.is('service.add_event')

app.controller('EventsController', EventsController)

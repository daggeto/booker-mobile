class EventsController
  constructor: ($scope, $state, $stateParams, UserService, Event) ->
    @scope = $scope
    @state = $state
    @calendar = $stateParams.calendar
    @service_id = $stateParams.id
    @UserService = UserService
    @Event = Event

    @event = Event.$new

    this

  statuses: [
      { value: 'free', label: 'Free' }
      { value: 'pending', label: 'Pending' }
      { value: 'booked', label: 'Booked' }
  ]

  modifyDate: (date) =>
    date_moment= moment(date)

    moment(@calendar.selectedDate)
      .hours(date_moment.hours())
      .minutes(date_moment.minutes())
      .format(@calendar.dateTimeFormat)

  save: =>
    @event['service_id'] = @service_id
    @event.start_at = @modifyDate(@event.start_at)
    @event.end_at = @modifyDate(@event.end_at)

    @Event.$r.save(@event).$promise.then(((response) =>
      @state.go('service.calendar')
    ), (refejcted) ->
      console.log('rejected')
    )

  showIosAddButton: ->
    @scope.ios && @state.is('service.add_event')

app.controller('EventsController', EventsController)

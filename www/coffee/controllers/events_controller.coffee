class EventsController
  constructor: ($scope, $state, $stateParams, UserService, Event) ->
    @scope = $scope
    @state = $state
    @stateParams = $stateParams
    @UserService = UserService
    @Event = Event

    @event = Event.$new

    this

  statuses: [
      { value: 'free', label: 'Free' }
      { value: 'pending', label: 'Pending' }
      { value: 'booked', label: 'Booked' }
  ]

  add: ->
    @event['service_id'] = @stateParams['id']

    @Event.$r.save(@event).$promise.then(((response) =>
      @service = response.service
    ), (refejcted) ->
      console.log('rejected')
    )

  showIosAddButton: ->
    @scope.ios && @state.is('service.add_event')

app.controller('EventsController', EventsController)

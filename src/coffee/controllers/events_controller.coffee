app.controller 'EventsController',
  (
    $scope,
    $state,
    $stateParams,
    ionicToast,
    moment,
    Event,
    EventsService,
    event,
    service,
    EVENT_STATUS
  ) ->
    new class EventsController
      constructor:  ->
        @ERROR_FIELDS = ['start_at']

        @calendar = $stateParams.calendar
        @service = service
        @event = event
        @Event = Event

        @initialEventStatus = event.status

        @initEvent()

      initEvent: ->
        unless event.start_at
          event.start_at = @modifyDate(new Date())
          @recalculateEndDate()
        else
          event.start_at = new Date(event.start_at)
          event.end_at = new Date(event.end_at)

      recalculateEndDate: ->
        event.end_at =
          moment(event.start_at)
            .add(@service.duration, 'minutes')
            .startOf('minute')
            .toDate()

      modifyDate: (date) =>
        date_moment = moment(date)

        moment(@calendar.selectedDate)
        .hours(date_moment.hours())
        .minutes(date_moment.minutes())
        .toDate()

      save: (form) =>
        @form = form

        return unless @validateTime()

        event.service_id = @service.id

        return EventsService.save(event).then(@response).catch(@failure) if @isAddState()

        EventsService.update(event).then(@response).catch(@failure) if @isEditState()

      validateTime: ->
        if moment(event.start_at).isAfter(event.end_at)
          @form['start_at'].$error.serverMessage = "Time From can't be after Time To"
          return false

        if event.start_at < new Date()
          @form['start_at'].$error.serverMessage = 'Time should be in future'
          return false

        true

      response: (response) =>
        $state.transitionTo('service.calendar',
          id: @service.id
          selectedDate: @calendar.selectedDate 
        )

      failure: (error) =>
        errors = error.data.errors
        for key, value of errors when key in @ERROR_FIELDS
          @form[key].$error.serverMessage = value[0]

      isAddState: ->
        $state.is('service.calendar.add_event')

      isEditState: ->
        $state.is('service.calendar.edit_event')

      isEditable: (event) ->
        @initialEventStatus == EVENT_STATUS.FREE

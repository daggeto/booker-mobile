app.controller 'EventsController',
  (
    $scope,
    $state,
    $stateParams,
    moment,
    Event,
    EventsService,
    LoggerService,
    event,
    service,
    EVENT_STATUS,
    translateFilter
  ) ->
    new class EventsController
      constructor:  ->
        @ERROR_FIELDS = ['start_at']

        @calendar = $stateParams.calendar
        @service = service
        @event = event
        @Event = Event

        @initialEventStatus = event.status
        @duration = service.duration

        @notFree = Event.isEventNotFree(event)

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
            .add(@duration, 'minutes')
            .startOf('minute')
            .toDate()

      modifyDate: (date) =>
        date_moment = moment(date)

        moment(@calendar.selectedDate)
        .hours(date_moment.hours())
        .minutes(date_moment.minutes())
        .startOf('minute')
        .toDate()

      startAtChanged: =>
        @recalculateEndDate() if event.start_at > event.end_at

      save: (form) =>
        @form = form

        return unless @form.$valid

        @warnAboutWrongEvent() if @eventEndsNextDay()
        return unless @validateTime()

        event.service_id = @service.id

        return EventsService.save(event).then(@response).catch(@failure) if @isAddState()

        EventsService.update(event).then(@response).catch(@failure) if @isEditState()

      validateTime: ->
        if (event.start_at > event.end_at)
          @invalidateFormFor('start_at', translateFilter('event.error.not_after'))

          return false

        if event.start_at < new Date()
          @invalidateFormFor('start_at', translateFilter('event.error.only_future'))

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
          @invalidateFormFor(key, value[0])

      invalidateFormFor: (fieldName, message) =>
        @form[fieldName].$error.message = message
        @form.$valid = false


      isAddState: ->
        $state.is('service.calendar.add_event')

      isEditState: ->
        $state.is('service.calendar.edit_event')

      isEditable: (event) ->
        @initialEventStatus == EVENT_STATUS.FREE

      warnAboutWrongEvent: ->
        message = "Saving wrong event dates! #{event.start_at} -> #{event.end_at}"
        LoggerService.sendMessage(message, level: 'warning', extraContext: event)

      eventEndsNextDay: ->
        startAtDay = moment(event.start_at)
        endAtDay = moment(event.end_at)

        startAtDay.diff(endAtDay, 'days')
